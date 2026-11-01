# Beautician Hub

**Your Beauty, Your Way.**

Beautician Hub is a full-stack MERN web application that connects customers with professional beauticians who provide beauty services at home. Customers search for beauticians, book appointments, track their status and leave reviews. Beauticians manage their profile, services, working hours and booking requests. Administrators approve profiles and monitor the whole platform.

It was built as a college project and is designed so it can grow into a real home beauty-service booking platform.

> **Payments:** this application does not process online payments. Customers agree on payment directly with the beautician. No payment gateway is integrated.

---

## Table of contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Project structure](#project-structure)
5. [Installation (Windows)](#installation-windows)
6. [Running the application](#running-the-application)
7. [Environment variables](#environment-variables)
8. [Sample data](#sample-data)
9. [Booking rules](#booking-rules)
10. [API endpoints](#api-endpoints)
11. [Security notes](#security-notes)
12. [Manual testing checklist](#manual-testing-checklist)
13. [Optional online hosting](#optional-online-hosting)
14. [Troubleshooting](#troubleshooting)
15. [Known limitations and ideas](#known-limitations-and-ideas)

---

## Features

### Customer
- Register and log in securely
- Browse the home page, service categories and services (prices in Indian rupees, ₹)
- Search beauticians by name, service, location and price; filter and sort services
- View beautician profiles with experience, ratings, services, prices and reviews
- Book a home appointment by choosing a service, date, available time and address
- Track bookings (Pending, Accepted, Rejected, Cancelled, Completed)
- Cancel bookings according to the cancellation rules
- Review and rate a beautician after a completed appointment
- Edit personal profile and default address

### Beautician
- Register and create a professional profile (photo link, experience, service area, description)
- Add, edit, hide and delete services with prices and durations
- Set weekly working hours (these decide which time slots customers see)
- Accept or reject booking requests, cancel accepted ones, and mark appointments completed
- Read customer reviews and see the average rating

### Administrator
- Protected admin dashboard with summary statistics and a bookings-by-status chart
- Approve or reject beautician profiles
- Suspend and reactivate customer and beautician accounts
- Manage service categories (add, edit, hide, delete)
- Monitor all bookings, services and reviews; suspend inappropriate services; delete inappropriate reviews
- Read messages sent from the Contact page

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, React Icons, React Hot Toast, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Community Server with Mongoose |
| API | REST APIs using JSON |
| Authentication | JWT (JSON Web Tokens) and bcrypt password hashing (`bcryptjs`) |
| Validation | express-validator on the server, plus form validation in React |
| Development | Visual Studio Code, nodemon |

---

## Prerequisites

- **Node.js 20 or newer** (includes npm): https://nodejs.org
- **MongoDB Community Server**, installed as a Windows service: https://www.mongodb.com/try/download/community
- **MongoDB Compass** (optional, installed with MongoDB) to look at the data
- **Visual Studio Code**: https://code.visualstudio.com

Check your versions:

```bash
node -v
npm -v
```

Check that MongoDB is running by opening MongoDB Compass and connecting to `mongodb://localhost:27017`.

---

## Project structure

```
beautician-hub/
├── README.md
├── .gitignore
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── availabilityController.js
│   │   ├── beauticianController.js
│   │   ├── bookingController.js
│   │   ├── categoryController.js
│   │   ├── contactController.js
│   │   ├── reviewController.js
│   │   └── serviceController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        (checks the login token)
│   │   ├── errorMiddleware.js       (clean JSON error responses)
│   │   ├── roleMiddleware.js        (customer / beautician / admin access)
│   │   └── validateMiddleware.js    (input validation messages)
│   ├── models/
│   │   ├── Availability.js
│   │   ├── BeauticianProfile.js
│   │   ├── Booking.js
│   │   ├── Category.js
│   │   ├── ContactMessage.js
│   │   ├── Review.js
│   │   ├── Service.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── availabilityRoutes.js
│   │   ├── beauticianRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── serviceRoutes.js
│   ├── .env                (your secrets, never shared)
│   ├── .env.example        (placeholders only)
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js             (creates the admin account and categories)
│   ├── seedSamples.js      (adds or removes sample beauticians and services)
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/         (logo.png, logo-icon.png)
    │   ├── components/     (Navbar, Footer, Layout, ProtectedRoute, ServiceCard,
    │   │                    BeauticianCard, DashboardLayout, Modal, ErrorBoundary, ...)
    │   ├── context/        (AuthContext.jsx)
    │   ├── pages/          (Home, Services, FindBeauticians, BeauticianProfilePage,
    │   │                    BookingPage, HowItWorks, About, Contact, Login, Register,
    │   │                    customer, beautician and admin dashboard pages)
    │   ├── services/       (api.js and one file per API area)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env                (API address)
    ├── .env.example
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Installation (Windows)

Open the `beautician-hub` folder in Visual Studio Code and use the integrated terminal (**Terminal → New Terminal**).

### 1. Backend

```bash
cd backend
npm install
```

Create the environment file by copying the example, then edit the values:

```bash
copy .env.example .env
```

Open `backend/.env` and fill in:

- `JWT_SECRET`: a long random text. Generate one with:

```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the login for the first administrator account.

Create the administrator account and the 10 service categories:

```bash
node seed.js
```

### 2. Frontend

```bash
cd ..\frontend
npm install
copy .env.example .env
```

The default `VITE_API_URL=http://localhost:5000/api` works for local development.

---

## Running the application

Use **two terminals**.

**Terminal 1: backend**

```bash
cd backend
npm run dev
```

Wait for:

```
Server running on port 5000
MongoDB connected: 127.0.0.1
```

**Terminal 2: frontend**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser. Use `localhost`, not `127.0.0.1`, because the backend only accepts requests from the address in `CLIENT_URL`.

Other commands:

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Starts the API and restarts it when you save a file |
| backend | `npm start` | Starts the API without auto-restart |
| backend | `node seed.js` | Creates the admin account and categories (safe to repeat) |
| backend | `node seedSamples.js` | Adds sample beauticians and services (safe to repeat) |
| backend | `node seedSamples.js --remove` | Removes the sample beauticians and everything linked to them |
| frontend | `npm run dev` | Starts the website in development mode |
| frontend | `npm run build` | Creates the production build in `dist/` |
| frontend | `npm run preview` | Previews the production build locally |

### Logging in

| Role | How to get an account |
|---|---|
| Customer | Register on the website, choosing "Book beauty services" |
| Beautician | Register choosing "Offer my services", then create a profile (an admin approves it) |
| Administrator | Created by `node seed.js` using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env` |

Administrators cannot be created from the Register page, which prevents anyone from giving themselves admin access.

---

## Environment variables

### backend/.env

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Port the API listens on |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/beautician_hub` | MongoDB connection string |
| `JWT_SECRET` | *(long random text)* | Secret used to sign login tokens. Keep it private |
| `JWT_EXPIRE` | `7d` | How long a login token stays valid |
| `CLIENT_URL` | `http://localhost:5173` | The website address allowed to call the API (CORS) |
| `ADMIN_NAME` | `Site Admin` | Name of the admin created by `seed.js` |
| `ADMIN_EMAIL` | `admin@example.com` | Admin login email |
| `ADMIN_PASSWORD` | *(your choice)* | Admin login password |
| `SAMPLE_PASSWORD` | *(optional)* | Password for sample beauticians created by `seedSamples.js` |

### frontend/.env

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Address of the backend API |

> Anything in the frontend `.env` is visible in the browser. Never put secrets there. The JWT secret and database string live only in `backend/.env`, which is listed in `.gitignore`.

---

## Sample data

`node seedSamples.js` adds 5 fictional beauticians (already approved) with about 21 services across all categories, with realistic prices in ₹, and Monday to Saturday working hours. All sample accounts use the email domain `@sample.beauticianhub.example`, and the script prints the sample password when it finishes. Names, emails and phone numbers are made up.

Remove them again at any time with:

```bash
node seedSamples.js --remove
```

---

## Booking rules

The server enforces these rules, so they cannot be bypassed from the browser.

- A beautician sets weekly working hours. Customers can only book start times inside those hours.
- Start times are offered every 30 minutes, and the whole service duration must fit inside the working hours.
- A time is not offered if it overlaps an existing Pending or Accepted booking, which prevents double bookings.
- A booking must start at least 60 minutes from now, and no more than 90 days ahead.
- A booking starts as **Pending**. The beautician can **Accept** or **Reject** it.
- A customer can cancel a Pending booking at any time, and an Accepted booking up to 24 hours before the appointment.
- A beautician can cancel an Accepted booking, and can mark it **Completed** only after the appointment has started.
- Only the customer of a Completed booking can leave a review, once per booking.
- Each beautician's average rating and review count are recalculated automatically.

---

## API endpoints

Base URL: `http://localhost:5000/api`. All bodies are JSON. Protected endpoints need the header `Authorization: Bearer <token>`, where the token comes from the login or register response.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register as `customer` or `beautician` |
| POST | `/auth/login` | Public | Log in and receive a token |
| GET | `/auth/me` | Logged in | Get my account |
| PUT | `/auth/me` | Logged in | Update my name, phone and address |

### Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List active categories |
| GET | `/categories/admin/all` | Admin | List all categories including hidden |
| POST | `/categories` | Admin | Create a category |
| PUT | `/categories/:id` | Admin | Update or hide a category |
| DELETE | `/categories/:id` | Admin | Delete a category (not allowed if services use it) |

### Beauticians

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/beauticians` | Public | Search approved beauticians. Query: `name`, `service`, `location`, `category`, `minPrice`, `maxPrice`, `sort` (`rating`, `experience`, `newest`) |
| GET | `/beauticians/:userId` | Public | Public profile with services and reviews |
| GET | `/beauticians/me/profile` | Beautician | Get my profile |
| PUT | `/beauticians/me/profile` | Beautician | Create or update my profile |
| GET | `/beauticians/admin/all` | Admin | List profiles. Query: `status` |
| PUT | `/beauticians/:userId/approval` | Admin | Set `Approved` or `Rejected` |

### Services

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/services` | Public | List services. Query: `category`, `search`, `minPrice`, `maxPrice`, `beautician`, `sort` (`newest`, `price_asc`, `price_desc`) |
| GET | `/services/mine` | Beautician | My services |
| GET | `/services/:id` | Public | One service with its beautician profile |
| POST | `/services` | Beautician | Add a service |
| PUT | `/services/:id` | Beautician (owner) | Edit, hide or show my service |
| DELETE | `/services/:id` | Beautician (owner) or Admin | Delete a service (blocked if it has Pending or Accepted bookings) |
| PUT | `/services/:id/suspend` | Admin | Suspend or restore a listing |

### Availability

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/availability/me` | Beautician | My weekly working hours |
| PUT | `/availability/me` | Beautician | Save my weekly working hours |
| GET | `/availability/:beauticianId/slots?date=YYYY-MM-DD&serviceId=...` | Public | Free start times for a date and service |

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/bookings` | Customer | Create a booking (status Pending) |
| GET | `/bookings/my` | Customer | My bookings |
| GET | `/bookings/beautician` | Beautician | Requests and appointments for me |
| GET | `/bookings/:id` | Customer, beautician of the booking, or Admin | One booking |
| PUT | `/bookings/:id/status` | Customer or beautician of the booking | Change status (allowed changes depend on the role and rules above) |

### Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/reviews` | Customer | Review a completed booking |
| GET | `/reviews/received` | Beautician | Reviews about me |
| GET | `/reviews/beautician/:beauticianId` | Public | Reviews of a beautician |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Dashboard numbers |
| GET | `/admin/users` | Admin | List users. Query: `role`, `status`, `search` |
| PUT | `/admin/users/:id/status` | Admin | Suspend (`suspended`) or reactivate (`active`) an account |
| GET | `/admin/services` | Admin | All services including suspended ones |
| GET | `/admin/bookings` | Admin | All bookings. Query: `status`, `date` |
| GET | `/admin/reviews` | Admin | All reviews |
| DELETE | `/admin/reviews/:id` | Admin | Delete a review |

### Contact

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/contact` | Public | Send a message from the Contact page (saved in the database, not emailed) |
| GET | `/contact` | Admin | List messages |
| PUT | `/contact/:id/read` | Admin | Mark a message read or unread |
| DELETE | `/contact/:id` | Admin | Delete a message |

### Responses and status codes

Successful responses contain `"success": true`. Errors return `"success": false` and a readable `"message"`:

| Code | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Invalid input, or an action that the rules do not allow |
| 401 | Not logged in, or the token is invalid or expired |
| 403 | Logged in, but the role or ownership does not allow it, or the account is suspended |
| 404 | Not found |
| 409 | The chosen time slot is no longer available |
| 429 | Too many requests, try again later |

---

## Security notes

- Passwords are hashed with bcrypt and are never returned by the API.
- Login tokens (JWT) are signed with `JWT_SECRET` from `.env`. No secret appears in the frontend code.
- Every protected route is checked on the server, both by role and by ownership. A customer cannot change another customer's booking, and a beautician cannot manage another beautician's services.
- Roles are fixed at registration to `customer` or `beautician`. Administrators are created only by the seed script.
- Suspended accounts cannot log in, and their existing tokens stop working.
- Input is validated on the server with express-validator and by Mongoose schemas.
- The API uses `helmet` security headers and rate limits login, registration and the contact form.
- `.env` files are excluded from version control. `.env.example` contains placeholders only.

---

## Manual testing checklist

A short list for demonstrating the project. Start the backend and frontend first.

1. **Public pages:** Home, Services, Find Beauticians, How It Works, About Us and Contact all load. Resize the browser to check laptop, tablet and phone layouts.
2. **Search:** filter services by category and price, and search beauticians by name, service and location.
3. **Register and log in** as a customer. Log out and back in. A wrong password shows an error.
4. **Protected routes:** while logged out, open `/customer`, `/beautician` and `/admin`. Each redirects to Login. While logged in as a customer, `/admin` redirects to the customer dashboard.
5. **Beautician flow:** register as a beautician, create a profile, add a service, set working hours. The beautician stays hidden from customers until approved.
6. **Admin flow:** log in as admin, approve the new profile on the Approvals page. The beautician now appears on Find Beauticians.
7. **Booking:** as a customer, open the beautician's profile, click Book Now, choose a date, a time, and an address, then confirm. The booking is Pending.
8. **Double booking:** try to book the same time again. The time is no longer offered, and a forced attempt returns a 409 error.
9. **Respond:** as the beautician, accept the request. The customer sees Accepted.
10. **Cancel and reject:** cancel a Pending booking as a customer, and reject another as the beautician.
11. **Complete and review:** after the appointment has started, the beautician marks it Completed, and the customer leaves a review. The beautician's rating updates.
12. **Admin controls:** suspend a user, suspend a service, delete a review, add a category, and read a Contact message.

---

## Optional online hosting

This is an outline for putting the project online. Each provider's screens change over time, so follow their current documentation.

1. **Database:** create a free MongoDB Atlas cluster, create a database user, allow your host's network access, and copy the connection string. Use it as `MONGO_URI`.
2. **Backend:** deploy the `backend` folder to a Node.js host. Set the environment variables (`MONGO_URI`, `JWT_SECRET` as a new random value, `JWT_EXPIRE`, `CLIENT_URL` set to your website's address, `ADMIN_*`). The start command is `npm start`. Run `node seed.js` once against the online database to create the admin and categories.
3. **Frontend:** set `VITE_API_URL` to your deployed API address ending in `/api`, run `npm run build` inside `frontend`, and deploy the `dist` folder to a static host. Configure the host to serve `index.html` for all page addresses so links such as `/services` work after a refresh.
4. **Proxy setting:** if the backend runs behind a hosting proxy, add `app.set("trust proxy", 1);` in `server.js` before the rate limiters, so each visitor is counted separately.
5. **Before going live with real customers:** use HTTPS, choose a strong admin password, and review the limitations below.

---

## Troubleshooting

| Problem | What to check |
|---|---|
| `mongod` is not recognized | Not a problem if MongoDB runs as a service. Check that Compass connects to `mongodb://localhost:27017`, or start **MongoDB Server** in `services.msc` |
| `MongoDB connection error ... ECONNREFUSED` | MongoDB is not running. Start the MongoDB service |
| `npm error ... package.json` | You are in the wrong folder. Use `backend` or `frontend` |
| Website shows "Cannot reach the server" | The backend is not running, or `VITE_API_URL` is wrong. Restart the frontend after changing `.env` |
| CORS error in the browser console | `CLIENT_URL` in `backend/.env` must match the website address exactly (no trailing slash). Restart the backend |
| Blank white page | Press F12 and read the Console tab. The error names the file |
| `Failed to resolve import` | A file is missing or in the wrong folder, or its name has different capital letters |
| `Route not found` in Thunder Client | Wrong HTTP method (GET, POST, PUT, DELETE) or a typo in the address |
| `Invalid ID format` | A placeholder such as `BOOKING_ID` was left in the address |
| 401 on an API request | Missing or expired token. Log in again and paste the new token |
| 403 on an API request | The token belongs to a different role |
| Port already in use | Another copy is running. Close it, or change `PORT` |

---

## Known limitations and ideas

- No online payments. Payment is handled directly between customer and beautician.
- Profile, service and category pictures are web links, not uploaded files. File uploads (for example with Multer and cloud storage) would be a natural next step.
- Contact messages are saved and shown to admins but not emailed. Email or SMS notifications for bookings are not included.
- Times use Indian Standard Time (IST).
- Ideas for later: rescheduling bookings, a favourites list, notifications, an admin analytics page, and multi-language support.

---

Created as a MERN stack college project: **React · Node.js · Express · MongoDB**.