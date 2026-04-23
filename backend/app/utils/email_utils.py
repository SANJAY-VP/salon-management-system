"""
Email utility for sending transactional emails (booking confirmations, etc.)
Falls back gracefully when SMTP is not configured — logs instead of crashing.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Internal helper — sends a single email via configured SMTP.
    Returns True on success, False on failure.
    """
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.info(
            "SMTP not configured — skipping email to %s | Subject: %s",
            to_email, subject
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())

        logger.info("Email sent to %s | Subject: %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_booking_confirmation_customer(
    customer_email: str,
    customer_name: str,
    booking_code: str,
    shop_name: str,
    service_name: str,
    slot_date: str,
    slot_time: str,
    amount_paid: float,
) -> bool:
    """Send booking confirmation email to the customer."""
    subject = f"Booking Confirmed — {shop_name} #{booking_code}"
    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111;color:#e5e5e5;border-radius:12px;overflow:hidden;">
      <div style="background:#d4af37;padding:28px 32px;">
        <h1 style="margin:0;color:#111;font-size:22px;letter-spacing:1px;">✂ BOOKING CONFIRMED</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin-top:0;">Hi <strong>{customer_name}</strong>,</p>
        <p>Your appointment has been confirmed. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Booking Code</td><td style="padding:10px 0;font-weight:bold;color:#d4af37;">#{booking_code}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Salon</td><td style="padding:10px 0;font-weight:bold;">{shop_name}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Service</td><td style="padding:10px 0;font-weight:bold;">{service_name}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Date</td><td style="padding:10px 0;font-weight:bold;">{slot_date}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Time</td><td style="padding:10px 0;font-weight:bold;">{slot_time}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Amount Paid</td><td style="padding:10px 0;font-weight:bold;color:#4ade80;">₹{amount_paid:.2f}</td></tr>
        </table>
        <p style="font-size:13px;color:#888;">Please arrive 5 minutes early. Bring this booking code for check-in.</p>
        <p style="font-size:13px;color:#888;margin-bottom:0;">Thank you for choosing SalonBook!</p>
      </div>
    </div>
    """
    return _send_email(customer_email, subject, html)


def send_booking_notification_barber(
    barber_email: str,
    barber_name: str,
    customer_name: str,
    customer_phone: str,
    booking_code: str,
    service_name: str,
    slot_date: str,
    slot_time: str,
    amount_paid: float,
    is_home_service: bool = False,
    customer_address: Optional[str] = None,
) -> bool:
    """Send new booking notification email to the barber / shop owner."""
    service_type = "HOME SERVICE" if is_home_service else "🪑 IN-SALON"
    subject = f"New {service_type} Booking — {customer_name} | {slot_date}"
    address_row = ""
    if is_home_service and customer_address:
        address_row = f'<tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Customer Address</td><td style="padding:10px 0;font-weight:bold;color:#f59e0b;">{customer_address}</td></tr>'

    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111;color:#e5e5e5;border-radius:12px;overflow:hidden;">
      <div style="background:#d4af37;padding:28px 32px;">
        <h1 style="margin:0;color:#111;font-size:22px;letter-spacing:1px;">✂ NEW BOOKING — {service_type}</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin-top:0;">Hi <strong>{barber_name}</strong>,</p>
        <p>You have a new booking. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Booking Code</td><td style="padding:10px 0;font-weight:bold;color:#d4af37;">#{booking_code}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Customer</td><td style="padding:10px 0;font-weight:bold;">{customer_name}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Phone</td><td style="padding:10px 0;font-weight:bold;"><a href="tel:{customer_phone}" style="color:#d4af37;">{customer_phone}</a></td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Service</td><td style="padding:10px 0;font-weight:bold;">{service_name}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Date</td><td style="padding:10px 0;font-weight:bold;">{slot_date}</td></tr>
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Time</td><td style="padding:10px 0;font-weight:bold;">{slot_time}</td></tr>
          {address_row}
          <tr><td style="padding:10px 0;color:#aaa;font-size:13px;">Amount Paid</td><td style="padding:10px 0;font-weight:bold;color:#4ade80;">₹{amount_paid:.2f} (Paid Online)</td></tr>
        </table>
        <p style="font-size:13px;color:#888;margin-bottom:0;">Please confirm this appointment in your dashboard.</p>
      </div>
    </div>
    """
    return _send_email(barber_email, subject, html)
