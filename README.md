<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.19-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
</p>

<h1 align="center">🎯 Job Tracker Pro</h1>

<p align="center">
  <strong>A modern, full-stack SaaS application to manage your job search like a CRM.</strong><br/>
  Track applications, manage contacts, set reminders, and gain insights into your job hunt.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🌟 Overview

**Job Tracker Pro** is a lightweight yet powerful job application tracker built for modern job seekers. It combines the simplicity of a spreadsheet with the power of a CRM, helping you stay organized throughout your job search journey.

### Why Job Tracker Pro?

- 📊 **Visual Pipeline** - See your applications flow through stages at a glance
- 🔒 **Secure & Private** - Your data stays yours with secure authentication
- 🌙 **Dark Mode** - Easy on the eyes during late-night job hunting sessions
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- 💰 **Freemium Model** - Start free, upgrade for power features

---

## ✨ Features

### Core Features (Available Now)

| Feature                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| 🔐**Authentication**    | Secure login/register with NextAuth.js + JWT           |
| 📝**Application CRUD**  | Create, view, edit, and soft-delete job applications   |
| 🎯**Stage Pipeline**    | Track progress: Saved → Applied → Interview → Offer |
| 🔍**Search & Filters**  | Filter by company, stage, tags, date range             |
| 📋**Notes & Tasks**     | Add notes and to-do items per application              |
| 👥**Contacts**          | Track recruiters, hiring managers, interviewers        |
| 🔗**Attachment Links**  | Save job posting URLs, portfolio links, etc.           |
| 📤**CSV Import/Export** | Bulk import applications, export for backup            |
| 📊**Dashboard**         | Weekly activity chart, stage breakdown, response rate  |
| 🌙**Dark Mode**         | Toggle between light and dark themes                   |
| 💳**Stripe Billing**    | Free tier + Pro subscription for power users           |
| 📜**Audit Logging**     | Track all actions for security and debugging           |

### Pro Features (Subscription)

- ✅ Unlimited applications (Free: 200 max)
- ✅ CSV export functionality
- ✅ Priority support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

---

### 🍎 macOS Setup

```bash
# 1. Clone the repository
git clone https://github.com/Yacine-Alexis/Mini-SaaS-Job-Tracker.git
cd Mini-SaaS-Job-Tracker

# 2. Install dependencies
npm install
cd web && npm install && cd ..

# 3. Set up environment variables
cp web/.env.example web/.env

# 4. Start PostgreSQL with Docker
cd web
docker compose -f docker.compose.yml up -d

# 5. Run database migrations
npm run prisma:migrate

# 6. (Optional) Seed with sample data
npm run prisma:seed

# 7. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

### 🪟 Windows Setup

**Using PowerShell (Run as Administrator recommended):**

```powershell
# 1. Clone the repository
git clone https://github.com/Yacine-Alexis/Mini-SaaS-Job-Tracker.git
cd Mini-SaaS-Job-Tracker

# 2. Install dependencies
npm install
cd web
npm install
cd ..

# 3. Set up environment variables
Copy-Item web\.env.example web\.env

# 4. Start PostgreSQL with Docker
cd web
docker compose -f docker.compose.yml up -d

# 5. Run database migrations
npm run prisma:migrate

# 6. (Optional) Seed with sample data
npm run prisma:seed

# 7. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

### 🐧 Linux Setup

```bash
# 1. Clone the repository
git clone https://github.com/Yacine-Alexis/Mini-SaaS-Job-Tracker.git
cd Mini-SaaS-Job-Tracker

# 2. Install dependencies
npm install
cd web && npm install && cd ..

# 3. Set up environment variables
cp web/.env.example web/.env

# 4. Start PostgreSQL with Docker
cd web
docker compose -f docker.compose.yml up -d

# 5. Run database migrations
npm run prisma:migrate

# 6. (Optional) Seed with sample data
npm run prisma:seed

# 7. Start the development server
npm run dev
```

---

### 🔧 Environment Variables

Edit `web/.env` to configure your instance:

| Variable                  | Description                            | Required |
| ------------------------- | -------------------------------------- | -------- |
| `DATABASE_URL`          | PostgreSQL connection string           | ✅       |
| `NEXTAUTH_URL`          | Your app URL (http://localhost:3000)   | ✅       |
| `NEXTAUTH_SECRET`       | Random secret for JWT signing          | ✅       |
| `STRIPE_SECRET_KEY`     | Stripe API key for billing             | ❌       |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret                  | ❌       |
| `SMTP_*`                | Email configuration for password reset | ❌       |

---

## 🛠 Tech Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| **Frontend**   | Next.js 14, React 18, Tailwind CSS |
| **Backend**    | Next.js API Routes, NextAuth.js    |
| **Database**   | PostgreSQL + Prisma ORM            |
| **Validation** | Zod                                |
| **Payments**   | Stripe                             |
| **Testing**    | Playwright (E2E), Vitest (Unit)    |
| **CI/CD**      | GitHub Actions                     |
| **Deployment** | Vercel / Docker                    |

---

## 📁 Project Structure

```
Mini-SaaS-Job-Tracker/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Sample data seeder
│   └── migrations/        # Database migrations
├── web/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Dashboard page
│   │   ├── applications/  # Applications pages
│   │   └── settings/      # Settings pages
│   ├── components/        # React components
│   ├── lib/               # Utilities & helpers
│   └── public/            # Static assets
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   └── unit/              # Vitest unit tests
└── .github/
    └── workflows/         # CI/CD pipelines
```

---

## 🗺 Roadmap

### Version 1.0 (Current)

- [X] User authentication (register, login, password reset)
- [X] Application CRUD with soft deletes
- [X] Stage pipeline visualization
- [X] Notes, tasks, contacts, attachments per application
- [X] Search, filters, and pagination
- [X] CSV import/export
- [X] Dashboard with metrics
- [X] Dark mode
- [X] Stripe billing integration
- [X] Audit logging
- [X] CI/CD pipeline

### Version 1.5 (Next)

- [ ] **Email Reminders** - Get notified about follow-ups and interviews
- [ ] **Calendar Integration** - Sync with Google Calendar / Outlook
- [ ] **Browser Extension** - Save jobs directly from LinkedIn, Indeed, etc.
- [ ] **Kanban Board View** - Drag-and-drop stage management
- [ ] **Mobile App** - React Native companion app

### Version 2.0 (Future)

- [ ] **AI Resume Tailor** - Auto-customize resume per job description
- [ ] **Interview Prep** - AI-generated interview questions based on job
- [ ] **Salary Insights** - Market data integration (Levels.fyi, Glassdoor)
- [ ] **Team Collaboration** - Share progress with career coaches/mentors
- [ ] **Analytics Dashboard** - Advanced insights and trends
- [ ] **API Access** - Public API for integrations
- [ ] **Multi-language Support** - i18n for global users

### Version 3.0 (Vision)

- [ ] **Job Board Aggregator** - Search jobs across all platforms
- [ ] **Auto-Apply** - One-click apply with saved profiles
- [ ] **Networking CRM** - Track professional connections
- [ ] **Company Research** - Glassdoor/LinkedIn company insights
- [ ] **Offer Negotiation Tool** - Compare offers, negotiate better

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run E2E tests (requires app running)
npm run test:e2e

# Run unit tests
npm run test:unit
```

---

## 💾 Database Backup & Recovery

### Manual Backup

```bash
# Export database to SQL file
pg_dump -h localhost -U postgres -d jobtracker > backup_$(date +%Y%m%d_%H%M%S).sql

# For Docker-based PostgreSQL
docker exec job-tracker-db pg_dump -U postgres jobtracker > backup.sql
```

### Automated Backups (Production)

For production deployments, we recommend:

1. **Managed Database Services** (Recommended)
   - Vercel Postgres, Supabase, or Neon provide automatic daily backups
   - Point-in-time recovery available on most providers

2. **Cron-based Backups**
   ```bash
   # Add to crontab (runs daily at 2 AM)
   0 2 * * * pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
   ```

3. **Cloud Storage Upload**
   ```bash
   # Upload to S3 after backup
   aws s3 cp backup.sql.gz s3://your-bucket/backups/
   ```

### Restore from Backup

```bash
# Restore from SQL file
psql -h localhost -U postgres -d jobtracker < backup.sql

# For Docker-based PostgreSQL
docker exec -i job-tracker-db psql -U postgres jobtracker < backup.sql
```

### CSV Export (User-Level Backup)

Users can export their own data via the Pro plan CSV export feature at `/applications/export`.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Yacine-Alexis/Mini-SaaS-Job-Tracker)

1. Click the button above
2. Connect your GitHub account
3. Set environment variables in Vercel dashboard
4. Deploy!

### Deploy with Docker

```bash
cd web
docker build -t job-tracker .
docker run -p 3000:3000 --env-file .env job-tracker
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Stripe](https://stripe.com/) - Payment processing

---

<p align="center">
  Made by <a href="https://github.com/Yacine-Alexis">Yacine-Alexis</a>
</p>

<p align="center">
  <a href="https://github.com/Yacine-Alexis/Mini-SaaS-Job-Tracker/stargazers">⭐ Star this repo</a> if you find it helpful!
</p>
