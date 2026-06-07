# EzyEstate Backend API

Complete production-ready backend for **EzyEstate** — a full-service real estate platform connecting property owners, builders, and buyers with end-to-end managed services.

## 🏗 Architecture

- **Framework**: Express.js (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (optional, for performance)
- **File Storage**: Cloudinary
- **Payments**: Razorpay
- **Notifications**: Twilio (SMS/WhatsApp), Nodemailer (Email)
- **Real-time**: Socket.IO
- **Background Jobs**: node-cron

---

## 📁 Project Structure

```
src/
├── config/          # DB, Redis, Cloudinary config
├── controllers/     # Business logic (auth, listings, projects, admin)
├── middleware/      # Auth, validation, rate limiting, uploads
├── models/          # Mongoose schemas (User, Listing, Project, etc.)
├── routes/          # API route definitions
├── services/        # OTP, email, payment, cache, notifications
├── utils/           # Logger, error handling, helpers
├── jobs/            # Cron jobs (expiry, follow-ups)
└── server.js        # Main app entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** (local or Atlas)
- **Redis** (optional, for caching)
- **Cloudinary** account (for image/file uploads)
- **Razorpay** account (for payments)
- **Twilio** account (for OTP/SMS/WhatsApp)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd ezyestate-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev

# Or production
npm start
```

---

## 🔐 Environment Variables

See `.env.example` for all required variables. **Critical ones**:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/ezyestate
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_token
REDIS_HOST=localhost (optional)
```

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/send-otp` | Send OTP to mobile | No |
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with OTP or password | No |
| POST | `/refresh-token` | Refresh access token | No |
| POST | `/logout` | Logout user | Yes |
| GET | `/me` | Get current user profile | Yes |
| PATCH | `/update-profile` | Update profile | Yes |
| PATCH | `/change-password` | Change password | Yes |

### Listings (`/api/v1/listings`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all listings (public feed) | Optional |
| GET | `/my-listings` | Get user's own listings | Yes |
| GET | `/:id` | Get listing by ID | Optional |
| POST | `/` | Create new listing | Yes (Owner) |
| PATCH | `/:id` | Update listing | Yes (Owner) |
| POST | `/:id/upload-photos` | Upload listing photos | Yes (Owner) |
| DELETE | `/:id/photos/:photoId` | Delete a photo | Yes (Owner) |
| POST | `/:id/pay-service-fee` | Initiate service fee payment | Yes (Owner) |
| POST | `/:id/enquire` | Express interest as buyer | Yes (Buyer) |
| POST | `/:id/shortlist` | Add/remove from shortlist | Yes |

### Projects (`/api/v1/projects`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all projects (public) | Optional |
| GET | `/my-projects` | Get builder's projects | Yes (Builder) |
| GET | `/:id` | Get project by ID | Optional |
| POST | `/` | Create new project | Yes (Builder) |
| PATCH | `/:id` | Update project | Yes (Builder) |
| POST | `/:id/upload-images` | Upload images/brochure | Yes (Builder) |
| POST | `/:id/enquire` | Express interest | Yes (Buyer) |
| POST | `/:id/shortlist` | Shortlist project | Yes |

### Payments (`/api/v1/payments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/verify` | Verify Razorpay payment | No (Webhook) |
| GET | `/my-payments` | Get user's payment history | Yes |

### Admin (`/api/v1/admin`)

All admin routes require `admin` or `superadmin` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard stats |
| GET | `/listings` | Get all listings (with filters) |
| PATCH | `/listings/:id/approve` | Approve listing |
| PATCH | `/listings/:id/reject` | Reject listing |
| PATCH | `/listings/:id/feature` | Toggle featured status |
| GET | `/projects` | Get all projects |
| PATCH | `/projects/:id/approve` | Approve project |
| PATCH | `/projects/:id/reject` | Reject project |
| GET | `/enquiries` | Get all enquiries |
| PATCH | `/enquiries/:id` | Update enquiry |
| POST | `/enquiries/:id/log-call` | Log a call |
| GET | `/deals` | Get all deals |
| POST | `/deals` | Create deal |
| PATCH | `/deals/:id` | Update deal |
| GET | `/users` | Get all users |
| PATCH | `/users/:id` | Update user (CRM tags, block, etc.) |

---

## 🔄 Background Jobs (Cron)

- **Daily 2 AM**: Expire listings past their expiry date
- **Daily 10 AM**: Send reminders for listings expiring in 7 days
- **Hourly**: Send follow-up reminders to admin team
- **Daily 3 AM**: Cleanup old OTPs

---

## 🗂 Database Models

### User
- Roles: `owner`, `builder`, `buyer`, `admin`, `superadmin`
- Mobile verification via OTP
- Password optional (OTP login preferred)
- Location preferences for buyers
- CRM tags and notes for admin

### Listing
- Owned by `owner` users
- Status: `pending_review` → `active` → `expired` / `sold`
- Service fee: ₹15,000 (paid via Razorpay)
- Property score (0-100) based on completeness
- Geo-indexed for location-based search

### Project
- Owned by `builder` users
- Multiple unit types (BHK, size, price)
- RERA number, brochure, floor plans
- Commission per unit booking

### Enquiry
- Buyer expresses interest in listing/project
- Admin assigns team member
- Call logs, site visit tracking
- Follow-up reminders

### Deal
- Created when enquiry progresses
- Tracks deal value, commission
- Stages: lead → contacted → site visit → closed

---

## 🔒 Security Features

- **JWT** with refresh tokens
- **OTP** authentication (Twilio)
- **Rate limiting** on all routes
- **Helmet** for HTTP headers
- **XSS** & **NoSQL injection** protection
- **Account lockout** after failed login attempts
- **Token blacklisting** on logout (Redis)

---

## 📊 Performance Optimizations

- **Redis caching** for listing/project feeds
- **Indexed queries** (geospatial, text search)
- **Pagination** on all list endpoints
- **Compression** middleware
- **Cloudinary** image optimization
- **Connection pooling** (MongoDB)

---

## 📤 File Uploads

All images/PDFs uploaded to **Cloudinary** with automatic optimization.

- **Listing photos**: Max 10, 10MB each
- **Project images**: Max 20
- **Brochure**: PDF, 20MB max
- **Floor plans**: 10 files

---

## 🧪 Testing

```bash
npm test
```

Uses **Jest** and **Supertest** for API testing.

---

## 🚢 Deployment

### Docker (Recommended)

```bash
docker build -t ezyestate-backend .
docker run -p 5000:5000 --env-file .env ezyestate-backend
```

### PM2 (Node.js Process Manager)

```bash
pm2 start src/server.js --name ezyestate
pm2 save
pm2 startup
```

### Environment-specific

- **Development**: `npm run dev`
- **Production**: `NODE_ENV=production npm start`

---

## 📞 Support

For issues or questions, contact the development team.

---

## 📝 License

Proprietary — EzyEstate Platform © 2024
