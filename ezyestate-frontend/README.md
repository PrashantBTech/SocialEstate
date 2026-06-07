# SocialEstate Frontend

React frontend for SocialEstate — full-service real estate platform.

## Tech Stack
- **React 18** + **Vite** (fast builds)
- **Tailwind CSS** (Design: Warm Orange Earthy theme)
- **TanStack Query** (server state, caching)
- **Zustand** (auth state)
- **React Router v6** (routing + code splitting)
- **React Hook Form + Yup** (forms + validation)
- **Recharts** (admin analytics charts)
- **Socket.IO Client** (real-time notifications)
- **React Helmet Async** (SEO)
- **React Hot Toast** (notifications)

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit VITE_API_BASE_URL to point to your backend

# Start dev server
npm run dev       # runs on http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

## Pages Built

### Public
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, stats, featured listings, builder projects, why choose section |
| Listing Feed | `/listings` | Filterable property feed with pagination |
| Listing Detail | `/listings/:id` | Full property details, photo gallery, enquiry button |
| Project Feed | `/projects` | Builder project listing |
| Login | `/login` | OTP-based login |
| Register | `/register` | Role-based registration (buyer/owner/builder) |

### Protected
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Owner: listing stats, payment, management |

### Admin Panel
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Stats, charts, new enquiries, active deals |
| Listings | `/admin/listings` | Approve/reject/feature listings with detail modal |
| Projects | `/admin/projects` | Approve/reject builder projects |
| Enquiries | `/admin/enquiries` | CRM: log calls, update status, follow-ups |
| Deal Pipeline | `/admin/deals` | Kanban-style deal tracking with commission calculator |
| Users & CRM | `/admin/users` | Tag, note, block users |

## Design System (Warm Orange Earthy)

```
Primary:  #D85A30 (terracotta orange)
Dark:     #2D1B0E (deep brown)
Cream:    #FFF8F4 (warm white)
Sand:     #F5EDE0 (warm beige)
Gold:     #E9C46A (warm accent)

Fonts:    Playfair Display (headings) + DM Sans (body)
```

## Performance Features
- **Code splitting** — all pages lazy-loaded
- **TanStack Query caching** — 5-min stale time
- **Optimistic UI** — instant feedback on actions
- **Image lazy loading** — all property photos
- **Gzip compression** — via Vite build

## SEO
- React Helmet Async for dynamic `<title>` and `<meta>`
- Semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- `loading="lazy"` on all images
- Structured data ready (add JSON-LD per page)

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
VITE_APP_NAME=SocialEstate
VITE_APP_URL=https://socialestate.in
```

## Deployment

### Netlify (easiest)
```bash
npm run build
# Deploy /dist folder to Netlify
# Set environment variables in Netlify dashboard
# Add redirects: echo "/* /index.html 200" > dist/_redirects
```

### Vercel
```bash
npm install -g vercel
vercel
```

### nginx
```nginx
server {
  listen 80;
  root /var/www/socialestate-frontend/dist;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```
