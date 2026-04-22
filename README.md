# BarberBook — Salon Management & Slot Booking System

A production-grade, full-stack salon management platform built with **FastAPI** (Python) + **React** (TypeScript). It allows barber shop owners to manage their salons, services, and bookings, while customers discover shops, select services, and book time slots in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.109, SQLAlchemy 2.0, Alembic, SQLite / PostgreSQL |
| Auth | JWT (HS256, 1-year lifetime), bcrypt password hashing |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand (persisted) |
| Payments | Razorpay (set `VITE_RAZORPAY_KEY_ID`) |
| Notifications | React Hot Toast (bottom-right position) |

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
cp app/.env.example app/.env        # set SECRET_KEY, DATABASE_URL, etc.
alembic upgrade head                # run migrations
uvicorn app.main:app --reload       # starts on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
# Optional — add your Razorpay key:
echo "VITE_RAZORPAY_KEY_ID=rzp_test_xxxx" > .env
npm run dev                         # starts on http://localhost:5173
```

---

## Core Booking Flow (Customer)

1. **Discover** — Browse / search salons on the home / search page.
2. **Explore** — View services, barbers, and reviews inside a shop page.
3. **Add to Cart** — Select one or more services; they land in the cart.
4. **Pick Slots** — Each cart item has an inline slot picker. Available slots are shown in green; slots already chosen for another service in the same cart are shown in yellow (concurrency prevention).
5. **Pay** — "Make Payment" creates all bookings and opens the Razorpay checkout.
6. **Confirm** — Booking confirmation is shown and full booking history is accessible from the profile.

---

## Slot System (Production-Grade)

Slots are **self-healing** — no manual intervention by barbers is required:

- The `GET /api/v1/slots/shop/{id}/available` endpoint auto-generates 30-minute slots from the shop's `opening_time` → `closing_time` **on-demand** when a customer requests a date that has no slots yet.
- The `GET /api/v1/slots/shop/{id}` (barber calendar) also auto-generates for any date range it is asked to display.
- The barber calendar still lets owners **view** all slots per day via a click-to-open modal (booked = red with customer name, available = green).
- Concurrency: once a slot is booked, it flips to `BOOKED` status and disappears from the available list — other customers never see it.

---

## HCI Principles Applied

The interface was designed around five core Human-Computer Interaction principles from the FLOW.md specification:

### 1. Visibility of System Status

> *"Users should always be informed about what is going on through appropriate feedback within reasonable time."* — Nielsen

**Where applied:**
- Every async action (login, booking creation, payment) shows a **loading toast** immediately, then transitions to a success or error toast.
- The cart shows a live badge: "Select slots for N remaining service(s)" so the customer always knows what still needs their attention.
- The barber calendar dots (green = available, red = booked) let shop owners scan a full month's occupancy at a glance.
- Shop open/closed status badge is always visible on the shop header and search cards.

---

### 2. Match Between System and the Real World

> *"The system should speak the users' language — words, phrases, and concepts familiar to the user, rather than system-oriented terms."*

**Where applied:**
- Time is displayed in human-readable `9:00 AM – 9:30 AM` format, never raw `HH:MM:SS`.
- Service durations are shown as "30 MIN", prices as "₹50" — matching how a customer reads a salon menu.
- Calendar navigation uses natural language labels ("Today", "Tomorrow", "Mon, Mar 23") instead of ISO date strings.
- Booking status labels use plain language (Confirmed / Completed / Cancelled) not backend enums.
- Barber avatars show the first letter of the name — a universally understood substitute for a profile photo.

---

### 3. User Control and Freedom

> *"Users often choose system functions by mistake and will need a clearly marked 'emergency exit' to leave the unwanted state."*

**Where applied:**
- A reusable `BackButton` component appears consistently on every deep page (shop detail, cart, payment) so users can exit without getting lost.
- Cart items can be removed individually; selected slots can be cleared with a "Change" link without losing the rest of the cart.
- Customers can cancel pending or confirmed bookings directly from the Profile page.
- The barber can toggle a salon open/closed instantly from both the dashboard and the shop overview sidebar.
- The slot picker is collapsible — opening it is always reversible.

---

### 4. Consistency and Standards

> *"Users should not have to wonder whether different words, situations, or actions mean the same thing."*

**Where applied:**
- Gold/dark luxury theme (`#d4af37` gold on deep cocoa) is applied identically across all barber and customer screens — same fonts (serif headings, sans body), same card radius, same button styles.
- Toast notifications use a single shared style (dark background, gold success icon, red error icon) regardless of which page triggers them.
- All toast notifications appear **bottom-right** — never in two different corners.
- Status badges follow a fixed colour grammar throughout: green = active/available, red = closed/booked/cancelled, gold = pending/rating.
- The accordion pattern is reused for both the barber's review list and the customer's review section.

---

### 5. Error Prevention

> *"Even better than good error messages is a careful design that prevents a problem from occurring in the first place."*

**Where applied:**
- The "Make Payment" button is **disabled** until every cart item has a slot selected — customers cannot accidentally book without a time.
- Slots already selected for one service are shown in **yellow** in the picker for other services, preventing double-booking of the same slot within a single cart session.
- Past dates are visually greyed out and non-clickable on the barber calendar.
- The calendar navigation is capped at **one month ahead** so barbers cannot navigate to an irrelevant future period.
- Phone fields use `maxLength={10}` and pincode fields `maxLength={6}` — over-length input is silently trimmed at the input layer.
- Shop creation requires latitude/longitude (validated before submit) so geolocation-based search always works.
- The slot booking endpoint uses a database-level `AVAILABLE` status check — a slot that was available when the page loaded but booked by another user before the customer confirms will fail gracefully with a clear error message.

---

## Environment Variables

### Backend (`backend/app/.env`)

```env
SECRET_KEY=your-secret-key-min-32-chars
DATABASE_URL=sqlite:///./barberbook.db   # or postgresql://...
ACCESS_TOKEN_EXPIRE_MINUTES=525600       # 1 year — sessions persist until logout
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx   # optional — mock payment used if absent
```

---

## API Reference (key endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register customer or barber owner |
| POST | `/api/v1/auth/login` | Public | Login → returns long-lived JWT |
| GET | `/api/v1/dashboard/search` | Public | Full-text + geo shop search |
| GET | `/api/v1/slots/shop/{id}/available` | Public | **Self-healing**: returns slots, auto-generates from shop hours if none exist |
| POST | `/api/v1/slots/shop/{id}/auto-generate` | Barber owner | Manually trigger slot generation for a date |
| POST | `/api/v1/bookings` | Auth | Create a booking (consumes a slot) |
| POST | `/api/v1/bookings/{id}/payment` | Customer | Record payment (integrates with Razorpay) |
| GET | `/api/v1/bookings/user/my-bookings` | Auth | Customer booking history |

Full interactive docs: `http://localhost:8000/docs`

---

## Project Structure

```
salon-management-system/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # JWT authentication middleware
│   │   └── utils/             # Auth utilities, dependencies
│   └── alembic/               # Database migrations
└── frontend/
    └── src/
        ├── pages/
        │   ├── barber/        # Dashboard, ShopDetails, Calendar, Profile
        │   └── customer/      # Home, Search, ShopDetails, Cart, Payment, Profile
        ├── components/
        │   ├── barber/        # ServiceManagement, ShopCalendar, BarberManagement
        │   ├── customer/      # ReviewManagement
        │   └── common/        # BackButton, Modal, Card, Button, Icon, Input
        ├── hooks/             # Zustand stores (auth, cart, shop, booking)
        └── services/          # Axios API service layer
```
