
# 📅 EventFlow

**EventFlow** is a modern, full-featured event management platform built with **Next.js**, **Prisma**, **TailwindCSS**, and **Radix UI**. It enables users to create, manage, and track events with a responsive interface and admin-friendly controls.

🔗 **Live Preview**: [eventflow.vercel.app](https://eventflow.vercel.app)  
📦 **Tech Stack**: Next.js · Prisma · TailwindCSS · React Hook Form · Zod · PostgreSQL · Radix UI · Paystack

---

## ✨ Features

- ✅ User authentication with secure cookies and JWT
- 🎨 Beautiful UI with Radix + TailwindCSS
- 📅 Event creation, editing, and management
- 💳 Event registration and payment with **Paystack**
- 🔐 Role-based access (admin/user)
- 📨 Email notifications via **Brevo (Sendinblue)**
- 📊 Charts and analytics (Recharts)
- 📤 QR code generation for ticketing
- 🌗 Light/Dark mode support
- 🧱 Modular code and reusable components

---

## ⚙️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/frobenius-projects/eventflow.git
cd eventflow
````

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following:

```env
# PostgreSQL Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/eventflowdb

# Auth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# Brevo SMTP Settings
EMAIL_SERVER_USER=your@email.com
EMAIL_SERVER_PASSWORD=your-brevo-smtp-password
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587

# Paystack Settings
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_CALLBACK_URL=http://localhost:3000/api/payment/callback
```

> 🔐 Get your Paystack keys from the [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)

---

### 4. Set up Prisma & the Database

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed   # Optional: If you have a seed script
```

To open Prisma Studio:

```bash
npm run prisma:studio
```

---

### 5. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📜 Available Scripts

| Script                    | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start development server                 |
| `npm run build`           | Build for production                     |
| `npm run start`           | Start production server                  |
| `npm run lint`            | Lint with ESLint                         |
| `npm run prisma:generate` | Generate Prisma client                   |
| `npm run prisma:migrate`  | Run DB migrations                        |
| `npm run prisma:studio`   | Open Prisma Studio                       |
| `npm run prisma:seed`     | Seed the database                        |
| `npm run postinstall`     | Auto-run Prisma generation after install |

---

## 🧩 Tech Stack

* **Frontend**: Next.js 15, React 19, TailwindCSS
* **Backend**: Prisma ORM, PostgreSQL
* **UI Components**: Radix UI, Lucide Icons, CMDK
* **Forms & Validation**: React Hook Form, Zod
* **Email**: Nodemailer + Brevo SMTP
* **Charts**: Recharts
* **Payments**: **Paystack**
* **Other Tools**:

  * QR Code Generation (`qrcode.react`)
  * Carousel (`embla-carousel-react`)
  * HTML to canvas (`html2canvas`)
  * Secure password hashing (`bcryptjs`)
  * Theme support (`next-themes`)

---

## 💳 Payments with Paystack

This app integrates with **Paystack** for secure event registration payments.

* Users can pay using card, bank, or USSD.
* All payment details are verified using Paystack's REST API.
* Callback URL handles payment verification and ticket confirmation.

### Required Environment Variables:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_CALLBACK_URL=http://localhost:3000/api/payment/callback
```

You can test with Paystack’s test card:

```text
Card Number: 4084 0840 8408 4081
Expiry: Any future date
CVV: 408
```

---

## 📬 Email Integration: Brevo (Sendinblue)

SMTP setup for Brevo:

```env
EMAIL_SERVER_USER=your@email.com
EMAIL_SERVER_PASSWORD=your-brevo-smtp-password
EMAIL_SERVER_HOST=smtp-relay.brevo.com
EMAIL_SERVER_PORT=587
```


## 📝 License

MIT License

---

## 🧠 Maintainer

Developed by **Oluwarotimi**
Have questions or suggestions? Feel free to open an issue or contribute.

