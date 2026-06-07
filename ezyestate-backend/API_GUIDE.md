# EzyEstate API Quick Start Guide

## Authentication Flow

### 1. Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "purpose": "register"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "data": {
    "devOtp": "123456"  // Only in development
  }
}
```

### 2. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "buyer",
  "city": "Indore",
  "state": "Madhya Pradesh",
  "pincode": "452001"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "fullName": "John Doe",
      "mobile": "9876543210",
      "role": "buyer"
    }
  }
}
```

### 3. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}

// OR with password:
{
  "mobile": "9876543210",
  "password": "SecurePass123"
}
```

---

## Creating a Listing (Owner)

### 1. Create Listing
```http
POST /api/v1/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyCategory": "residential",
  "propertyType": "plot",
  "askingPrice": 2500000,
  "isPriceNegotiable": true,
  "possessionStatus": "ready",
  "location": {
    "state": "Madhya Pradesh",
    "city": "Indore",
    "locality": "Vijay Nagar",
    "pincode": "452010",
    "landmark": "Near Bombay Hospital",
    "coordinates": {
      "coordinates": [75.8577, 22.7196]
    }
  },
  "totalArea": {
    "value": 1200,
    "unit": "sqft"
  },
  "description": "Prime residential plot in Vijay Nagar with clear title...",
  "ownershipType": "freehold",
  "documentsAvailable": ["registry", "map", "noc"],
  "amenities": {
    "waterSupply": "municipal",
    "preferredContactTime": "evening"
  }
}
```

### 2. Upload Photos
```http
POST /api/v1/listings/:listingId/upload-photos
Authorization: Bearer <token>
Content-Type: multipart/form-data

photos: [file1.jpg, file2.jpg, ...]
```

### 3. Pay Service Fee
```http
POST /api/v1/listings/:listingId/pay-service-fee
Authorization: Bearer <token>

// Returns Razorpay order details for frontend integration
```

---

## Buyer Flow

### 1. Browse Listings
```http
GET /api/v1/listings?city=Indore&propertyType=plot&budgetMin=2000000&budgetMax=3000000&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Listings fetched.",
  "data": {
    "listings": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 2. View Listing Details
```http
GET /api/v1/listings/:id
Authorization: Bearer <token>  // Optional
```

### 3. Express Interest
```http
POST /api/v1/listings/:id/enquire
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Interest registered. Our team will contact you soon.",
  "data": {
    "enquiry": {...}
  }
}
```

---

## Admin Operations

### Approve Listing
```http
PATCH /api/v1/admin/listings/:id/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "sendEmail": true
}
```

### Get All Enquiries
```http
GET /api/v1/admin/enquiries?status=new&page=1&limit=50
Authorization: Bearer <admin-token>
```

### Log Call
```http
POST /api/v1/admin/enquiries/:id/log-call
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "outcome": "answered",
  "duration": 180,
  "notes": "Buyer is interested, scheduling site visit for Saturday.",
  "followUpDate": "2024-04-25T10:00:00Z",
  "status": "qualified"
}
```

---

## Error Responses

All errors follow this structure:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "mobile",
      "message": "Please enter a valid 10-digit Indian mobile number"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (no token / invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limits

- **Global**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes
- **OTP endpoints**: 3 requests per minute
- **Upload endpoints**: 50 requests per hour

---

## Real-time Notifications (Socket.IO)

```javascript
// Frontend connection
const socket = io('http://localhost:5000');

socket.emit('authenticate', userId);

socket.on('notification', (data) => {
  console.log('New notification:', data);
  // { id, type, title, message, data, createdAt }
});
```

---

## Development Tips

1. **OTP in Development**: In dev mode, OTP is returned in API response for easy testing.

2. **Payment Testing**: Use Razorpay test keys. Test payment details:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Redis Optional**: If Redis is not running, caching will gracefully degrade (no errors).

4. **File Uploads**: Use `multipart/form-data` with proper field names (`photos`, `logo`, `brochure`, etc.).

---

## Postman Collection

Import this into Postman:
```json
{
  "info": {
    "name": "EzyEstate API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Update `{{baseUrl}}` and `{{token}}` variables as needed.
