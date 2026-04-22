"""
Booking management routes — slot booking, payment (Razorpay), email notifications.
All slot booking operations use row-level locking (SELECT FOR UPDATE) to prevent
double-booking under concurrent requests, matching BookMyShow-style production behaviour.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.services.booking_service import BookingService
from app.services.slot_service import SlotService
from app.services.service_service import ServiceService
from app.services.transaction_service import TransactionService
from app.services.barber_shop_service import BarberShopService
from app.schemas.booking_schemas import (
    BookingCreate, BookingUpdate, BookingResponse,
    BookingCancel, BookingComplete
)
from app.schemas.payment_schemas import PaymentCreate, PaymentResponse, RazorpayOrderCreate
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.utils.email_utils import (
    send_booking_confirmation_customer,
    send_booking_notification_barber,
)
from app.models.user import UserRole
from app.models.slot import Slot as SlotModel, SlotStatus
from app.models.booking import BookingStatus
from app.models.transaction import PaymentStatus
import razorpay
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _enrich(booking, db: Session):
    """
    Attach slot date/time, service name/price, shop name, and amount_paid
    directly onto the booking ORM object so Pydantic can serialise them.
    This avoids N+1 by using already-loaded relationships when available.
    """
    # Slot info
    slot = db.query(SlotModel).filter(SlotModel.id == booking.slot_id).first()
    booking.slot_date = slot.date if slot else None
    booking.slot_start_time = slot.start_time if slot else None
    booking.slot_end_time = slot.end_time if slot else None

    # Service info
    from app.models.service import Service as ServiceModel
    svc = db.query(ServiceModel).filter(ServiceModel.id == booking.service_id).first() if booking.service_id else None
    booking.service_name = svc.name if svc else None
    booking.service_price = svc.price if svc else None

    # Shop info
    from app.models.barber_shop import BarberShop
    shop = db.query(BarberShop).filter(BarberShop.id == booking.shop_id).first()
    booking.shop_name = shop.name if shop else None

    # Payment info
    from app.models.transaction import Transaction
    txn = db.query(Transaction).filter(Transaction.booking_id == booking.id).first()
    booking.amount_paid = txn.final_amount if txn else None
    booking.payment_method = txn.payment_method.value if txn else None

    return booking


# ──────────────────────────────────────────────────────────────────────────────
# CREATE BOOKING  (POST /bookings)
# Uses SELECT FOR UPDATE so that two concurrent users cannot book the same slot.
# ──────────────────────────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Booking",
    operation_id="booking_create",
)
def create_booking(
    booking_data: BookingCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Create a new booking.  Slot availability is checked with a row-level
    lock (SELECT FOR UPDATE) inside this request so parallel requests
    for the same slot get a clean 400 "Slot is not available" error
    rather than a duplicate booking.
    """
    current_user = get_current_user_from_request(request)

    service = ServiceService.get_service_by_id(db, booking_data.service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    if booking_data.points_used > current_user.points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient loyalty points",
        )

    # ── Atomic slot claim with row-level lock ──────────────────────────────
    # SELECT FOR UPDATE prevents two concurrent requests from booking the same slot.
    # SQLite (dev) does not support row-level locks — we fall back gracefully;
    # PostgreSQL (prod) handles this natively.
    try:
        slot = (
            db.query(SlotModel)
            .filter(
                SlotModel.id == booking_data.slot_id,
                SlotModel.status == SlotStatus.AVAILABLE,
            )
            .with_for_update()
            .first()
        )
    except OperationalError:
        slot = (
            db.query(SlotModel)
            .filter(
                SlotModel.id == booking_data.slot_id,
                SlotModel.status == SlotStatus.AVAILABLE,
            )
            .first()
        )

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This slot is no longer available. Please choose a different time.",
        )

    # Mark slot BOOKED immediately (within the same DB transaction)
    slot.status = SlotStatus.BOOKED

    booking = BookingService.create_booking(
        db=db,
        user_id=current_user.id,
        shop_id=slot.shop_id,
        **booking_data.model_dump(),
    )

    if booking_data.points_used > 0:
        from app.services.user_service import UserService  # local import to avoid circular dependency
        UserService.update_user_points(db, current_user.id, -booking_data.points_used)

    db.commit()
    db.refresh(booking)
    return booking


# ──────────────────────────────────────────────────────────────────────────────
# READ endpoints — all static sub-paths MUST come before /{booking_id}
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "/user/my-bookings",
    response_model=List[BookingResponse],
    summary="Get My Bookings",
    operation_id="booking_list_mine",
)
def get_my_bookings(
    request: Request,
    booking_status: Optional[BookingStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all bookings for the authenticated customer, enriched with slot/service/payment data."""
    current_user = get_current_user_from_request(request)
    bookings = BookingService.get_bookings_by_user(
        db=db,
        user_id=current_user.id,
        status=booking_status,
        skip=skip,
        limit=limit,
    )
    return [_enrich(b, db) for b in bookings]


@router.get(
    "/shop/{shop_id}",
    response_model=List[BookingResponse],
    summary="Get Shop Bookings",
    operation_id="booking_list_by_shop",
)
def get_shop_bookings(
    shop_id: int,
    request: Request,
    booking_status: Optional[BookingStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all bookings for a shop (owner/admin only)."""
    current_user = get_current_user_from_request(request)
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return BookingService.get_bookings_by_shop(
        db=db, shop_id=shop_id, status=booking_status, skip=skip, limit=limit
    )


@router.get(
    "/code/{booking_code}",
    response_model=BookingResponse,
    summary="Get Booking by Code",
    operation_id="booking_get_by_code",
)
def get_booking_by_code(booking_code: str, request: Request, db: Session = Depends(get_db)):
    """Retrieve a booking using its unique booking code."""
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_code(db, booking_code)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
    if (
        booking.user_id != current_user.id
        and shop.owner_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return _enrich(booking, db)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get Booking by ID",
    operation_id="booking_get",
)
def get_booking(booking_id: int, request: Request, db: Session = Depends(get_db)):
    """Retrieve a single booking by its numeric ID."""
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
    if (
        booking.user_id != current_user.id
        and shop.owner_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return _enrich(booking, db)


# ──────────────────────────────────────────────────────────────────────────────
# STATUS TRANSITIONS
# ──────────────────────────────────────────────────────────────────────────────

@router.patch(
    "/{booking_id}/confirm",
    response_model=BookingResponse,
    summary="Confirm Booking",
    operation_id="booking_confirm",
)
def confirm_booking(booking_id: int, request: Request, db: Session = Depends(get_db)):
    """Shop owner or admin confirms a pending booking."""
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return BookingService.confirm_booking(db, booking_id)


@router.patch(
    "/{booking_id}/complete",
    response_model=BookingResponse,
    summary="Complete Booking",
    operation_id="booking_complete",
)
def complete_booking(
    booking_id: int,
    complete_data: BookingComplete,
    request: Request,
    db: Session = Depends(get_db),
):
    """Mark a booking as completed and award loyalty points (owner/admin only)."""
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    updated = BookingService.complete_booking(db, booking_id, complete_data.points_earned)
    SlotService.complete_slot(db, booking.slot_id)
    return updated


@router.patch(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel Booking",
    operation_id="booking_cancel",
)
def cancel_booking(
    booking_id: int,
    cancel_data: BookingCancel,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Cancel a booking (customer, owner, or admin).
    On cancellation the slot is released back to AVAILABLE automatically.
    """
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
    if (
        booking.user_id != current_user.id
        and shop.owner_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending or confirmed bookings can be cancelled",
        )

    updated = BookingService.cancel_booking(db, booking_id)

    # Release the slot so others can book it
    slot = db.query(SlotModel).filter(SlotModel.id == booking.slot_id).first()
    if slot and slot.status == SlotStatus.BOOKED:
        slot.status = SlotStatus.AVAILABLE
        db.commit()

    if booking.points_used > 0:
        from app.services.user_service import UserService  # local to avoid circular import
        UserService.update_user_points(db, booking.user_id, booking.points_used)

    return updated


# ──────────────────────────────────────────────────────────────────────────────
# PAYMENT — Razorpay order creation  (POST /bookings/{id}/payment/razorpay-order)
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/{booking_id}/payment/razorpay-order",
    summary="Create Razorpay Order",
    operation_id="payment_razorpay_create_order",
)
def create_razorpay_order(
    booking_id: int,
    order_data: RazorpayOrderCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Create a Razorpay order for the given booking.
    The frontend uses the returned order_id to open the Razorpay checkout modal,
    which supports UPI, Cards, Net Banking, Wallets — all in one flow.
    """
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured",
        )
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order = client.order.create(
            {
                "amount": int(order_data.amount * 100),  # paise
                "currency": "INR",
                "receipt": f"booking_{booking_id}",
                "notes": {
                    "booking_id": str(booking_id),
                    "customer": booking.customer_name,
                },
            }
        )
        return {
            "order_id": order["id"],
            "amount": order_data.amount,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID,
        }
    except Exception as exc:
        logger.error("Razorpay order creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error. Please try again.",
        )


# ──────────────────────────────────────────────────────────────────────────────
# PAYMENT — record verified payment  (POST /bookings/{id}/payment)
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/{booking_id}/payment",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Payment",
    operation_id="payment_record",
)
def record_payment(
    booking_id: int,
    payment_data: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verify Razorpay signature (HMAC-SHA256) and record the payment.
    On success:
      • Booking status → CONFIRMED
      • Sends confirmation email to customer
      • Sends notification email to the barber / shop owner
    """
    current_user = get_current_user_from_request(request)
    booking = BookingService.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    # ── Razorpay signature verification (production-grade HMAC check) ──────
    method_val = payment_data.payment_method.value.lower()
    if method_val == "razorpay" and settings.RAZORPAY_KEY_ID:
        if not (payment_data.razorpay_signature and payment_data.razorpay_order_id and payment_data.transaction_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Razorpay verification fields (order_id, payment_id, signature)",
            )
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": payment_data.razorpay_order_id,
                    "razorpay_payment_id": payment_data.transaction_id,
                    "razorpay_signature": payment_data.razorpay_signature,
                }
            )
        except razorpay.errors.SignatureVerificationError:
            logger.warning(
                "Razorpay signature mismatch for booking %s | order=%s payment=%s",
                booking_id,
                payment_data.razorpay_order_id,
                payment_data.transaction_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed — invalid signature.",
            )

    # ── Persist transaction ────────────────────────────────────────────────
    transaction = TransactionService.create_transaction(
        db=db,
        booking_id=booking_id,
        payment_method=payment_data.payment_method,
        amount=payment_data.amount,
        discount=payment_data.discount,
        payment_gateway_id=payment_data.transaction_id,
    )
    transaction.status = PaymentStatus.COMPLETED
    transaction.completed_at = datetime.utcnow()

    if booking.status == BookingStatus.PENDING:
        booking.status = BookingStatus.CONFIRMED

    db.commit()
    db.refresh(transaction)

    # ── Fire-and-forget emails ─────────────────────────────────────────────
    try:
        db.refresh(booking)  # ensure relationships are loaded
        shop = BarberShopService.get_shop_by_id(db, booking.shop_id)
        service = ServiceService.get_service_by_id(db, booking.service_id) if booking.service_id else None
        slot = db.query(SlotModel).filter(SlotModel.id == booking.slot_id).first()

        slot_date_str = slot.date.strftime("%d %b %Y") if slot else "N/A"
        slot_time_str = (
            f"{slot.start_time.strftime('%I:%M %p')} – {slot.end_time.strftime('%I:%M %p')}"
            if slot
            else "N/A"
        )
        service_name = service.name if service else "Service"
        is_home = bool(slot and slot.barber_id)

        # Resolve the individual barber for this slot (for home-service notification)
        barber_user = None
        if slot and slot.barber_id:
            from app.models.barber import Barber as BarberModel
            barber_user = db.query(BarberModel).filter(BarberModel.id == slot.barber_id).first()

        # ── Customer confirmation ──────────────────────────────────────────
        if booking.customer_email:
            send_booking_confirmation_customer(
                customer_email=booking.customer_email,
                customer_name=booking.customer_name,
                booking_code=booking.booking_code,
                shop_name=shop.name if shop else "Salon",
                service_name=service_name,
                slot_date=slot_date_str,
                slot_time=slot_time_str,
                amount_paid=payment_data.amount,
            )

        # ── Shop owner notification ───────────────────────────────────────
        if shop and shop.email:
            send_booking_notification_barber(
                barber_email=shop.email,
                barber_name=shop.name,
                customer_name=booking.customer_name,
                customer_phone=booking.customer_phone,
                booking_code=booking.booking_code,
                service_name=service_name,
                slot_date=slot_date_str,
                slot_time=slot_time_str,
                amount_paid=payment_data.amount,
                is_home_service=is_home,
                customer_address=current_user.address,
            )

        # ── Individual barber notification (home-service only) ───────────
        # Send a separate email to the assigned barber so they know to travel.
        if is_home and barber_user and barber_user.email and barber_user.email != shop.email:
            send_booking_notification_barber(
                barber_email=barber_user.email,
                barber_name=barber_user.name or "Barber",
                customer_name=booking.customer_name,
                customer_phone=booking.customer_phone,
                booking_code=booking.booking_code,
                service_name=service_name,
                slot_date=slot_date_str,
                slot_time=slot_time_str,
                amount_paid=payment_data.amount,
                is_home_service=True,
                customer_address=current_user.address,
            )
    except Exception as email_exc:
        # Never let email failure break the payment response
        logger.error("Email dispatch error after payment: %s", email_exc)

    return transaction
