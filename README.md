# Mum's Kitchen — Website

**Authentic Korean Cuisine · Tranmere SA 5073**

A full-stack restaurant website built with Next.js 15, MongoDB, Stripe payments, and Cloudinary multi-image uploads.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Next.js 15** (App Router) | Frontend + API routes |
| **MongoDB Atlas** | Database |
| **Mongoose** | DB ORM |
| **NextAuth v5** | Authentication (JWT) |
| **Stripe** | Online payments |
| **Cloudinary** | Multi-image food photo uploads |
| **Zustand** | Cart state |
| **Hostinger VPS** | Hosting |
| **PM2** | Node.js process manager |

---

## Features

- 🛒 **Online Ordering** — Takeaway & Delivery with Stripe checkout
- 📅 **Table Booking** — 3-step booking with conflict prevention
- 🖼️ **Multi-image** per menu item with gallery carousel
- 📏 **Size variants** — S/L pricing for fried chicken
- 👨‍💼 **Admin Panel** — Full menu CRUD, orders, bookings, tables
- 📱 **Fully responsive** — Mobile-first design
- 🔐 **Auth** — Customer accounts + admin role
- 🌐 **SEO optimised** — Meta tags, structured data

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.local.example .env.local
# Fill in your MongoDB URI, Stripe keys, Cloudinary keys

# 3. Run dev server
npm run dev

# 4. Seed database (first time)
# Visit: http://localhost:3000/admin
# Click "Seed Database" button
# OR: curl -X POST http://localhost:3000/api/seed

# Admin login: admin@mumskitchen.com.au / Admin@1234
```

---

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mumskitchen
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=mumskitchen_unsigned
RESEND_API_KEY=re_...
```

---

## Hostinger VPS Deployment

### Step 1 — Get a Hostinger VPS (KVM 2 minimum, Ubuntu 22.04)

### Step 2 — Connect via SSH
```bash
ssh root@YOUR_VPS_IP
```

### Step 3 — Install Node.js 20 + PM2 + Nginx
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs nginx
npm install -g pm2
```

### Step 4 — Upload your project
```bash
# On your local machine:
zip -r mumskitchen.zip mumskitchen/ --exclude "*/node_modules/*" --exclude "*/.next/*"
scp mumskitchen.zip root@YOUR_VPS_IP:/var/www/

# On VPS:
cd /var/www && unzip mumskitchen.zip
cd mumskitchen
npm install
```

### Step 5 — Create .env.local on VPS
```bash
nano /var/www/mumskitchen/.env.local
# Paste all your production environment variables
```

### Step 6 — Build and start with PM2
```bash
cd /var/www/mumskitchen
npm run build
pm2 start npm --name "mumskitchen" -- start
pm2 save
pm2 startup
```

### Step 7 — Configure Nginx
```bash
nano /etc/nginx/sites-available/mumskitchen
```

Paste this config:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/mumskitchen /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Step 8 — SSL (Free via Certbot)
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 9 — Point your domain
In Hostinger hPanel → DNS → Add A record:
- `@` → `YOUR_VPS_IP`
- `www` → `YOUR_VPS_IP`

---

## Cloudinary Setup (Multi-image uploads)

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. Dashboard → Settings → Upload → Add upload preset
3. Name it `mumskitchen_unsigned`, set to **Unsigned**
4. Copy Cloud Name, API Key, API Secret to `.env.local`

---

## Stripe Setup

1. [stripe.com](https://stripe.com) → Create account
2. Developers → API Keys → copy keys to `.env.local`
3. For webhooks: Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## MongoDB Atlas Setup

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) → Free tier (M0)
2. Create cluster → Database Access → Add user
3. Network Access → Allow `0.0.0.0/0` (or your VPS IP)
4. Connect → Drivers → Copy connection string

---

## Admin Panel

Visit `/admin` after seeding:
- **Menu** — Add/edit/delete items, upload multiple food photos, toggle availability
- **Orders** — View & update order status
- **Bookings** — View & manage table reservations
- **Tables** — Add/remove tables

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/menu` | Full menu with category filters |
| `/order` | Order online (takeaway/delivery) |
| `/dine-in` | Table booking |
| `/checkout` | Stripe checkout |
| `/contact` | Contact form + hours |
| `/dashboard` | Customer order history |
| `/login` | Sign in |
| `/register` | Create account |
| `/admin` | Admin dashboard |
| `/admin/menu` | Menu management |
| `/admin/orders` | Order management |
| `/admin/bookings` | Booking management |
| `/admin/tables` | Table management |

---

*Mum's Kitchen — 66 Reid Avenue, Tranmere SA 5073*
*mumskitchentranmere@gmail.com · ABN 61 615 671 935*
