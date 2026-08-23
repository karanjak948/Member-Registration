# Royal SACCO — Enterprise Member & Loan Management System

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-064E3B?style=for-the-badge)]()

An enterprise-grade, multi-tier SACCO & Microfinance Management platform. The system delivers end-to-end member lifecycle tracking, 5-stage KYC registration wizards, loan appraisal and disbursement workflows, repayment collection management, M-Pesa reconciliation, and fine-grained administrative role-based access control (RBAC).

---

## 🏛️ System Architecture

```
                                      ┌─────────────────────────────────┐
                                      │       NGINX REVERSE PROXY       │
                                      │          (Port 80/443)          │
                                      └──────────────┬──────────────────┘
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
                             ▼                                               ▼
              ┌─────────────────────────────┐                 ┌─────────────────────────────┐
              │     NEXT.JS FRONTEND        │                 │       DJANGO BACKEND        │
              │   (App Router + NextAuth)   │ ──REST / OAuth─►│  (REST Framework + Service) │
              │          Port 3000          │                 │          Port 8000          │
              └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                             │                                               │
                             ▼                                               ▼
              ┌─────────────────────────────┐                 ┌─────────────────────────────┐
              │      ROYAL LOAN ENGINE      │                 │     DATABASE ENGINE         │
              │     (Credit Core API)       │                 │   (MySQL / PostgreSQL)      │
              └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 🚀 Core Features & Modules

### 1. 🏛️ Member Registration & KYC Lifecycle
* **5-Step Registration Wizard**: Multi-step data capture (Personal KYC, Next of Kin, Vehicle Collateral, Guarantor Validation, and Document Uploads).
* **Workflow Approval Engine**: Multi-stage approvals (`DATA_CAPTURE_PENDING` ➔ `KYC_SUBMITTED` ➔ `APPROVED` ➔ `ACTIVE`).
* **Member Categories**: Normal, Special, and Custom Member tiers with configurable fee structures.
* **Audit Trails & History**: Immutable logging of all member modifications, approvals, conversions, and deactivations.

### 2. 💰 Jinue Loans & Credit Portfolio
* **Loan Origination**: Member KYC verification, guarantor cross-referencing, collateral appraisals, and interest tier selection.
* **Credit Governance & Approvals**: Role-governed appraisal desks with status transitions (`Pending Review` ➔ `Appraised` ➔ `Approved`).
* **Loan Disbursement Desk**: Dedicated finance desk for releasing approved funds and recording live disbursement accounts.
* **Active Loan Timetable**: Real-time amortization schedule monitoring weekly/monthly principal and interest installments.
* **Discharge & Clearance Certificates**: Formal clearance generation and liability release upon full repayment.

### 3. 💳 Financial Collections & Treasury
* **Receive Payments**: Instant teller posting for loan repayments, member deposits, and share capital.
* **M-Pesa Reconciliation**: Automated matching and allocation of Paybill/Till receipts to member accounts.
* **Treasury Ledgers**: Manual and automated double-entry ledger journals.
* **Arrears & Penalties**: Overdue loan detection, penalty calculation, and recovery workflows.

### 4. 🛡️ Role-Based Access Control (RBAC) & Governance
* **Granular Permissions Catalog**: Module-level permission assignment across `Members`, `Loans`, `Collections`, `Users`, and `Roles`.
* **Administrative Governance**: Create custom roles (e.g. *Credit Committee Officer*, *Loan Officer*, *Branch Manager*, *Auditor*) with restricted capability views.
* **Zero-Trust Server Protection**: Server-side session verification on all mutations preventing unauthorized status escalations.

### 5. 📊 Executive Analytics & Business Intelligence
* Interactive portfolio composition charts, repayment vs. arrears ratios, member growth rates, and top-performing loan products.

---

## 🐳 Docker Deployment (Recommended)

The easiest way to run the entire stack (Frontend, Backend, Database, and Nginx reverse proxy) is using **Docker Compose**:

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0+)
* Docker Compose (v2.0+)

### 1. Clone the Repository
```bash
git clone https://github.com/karanjak948/Member-Registration.git
cd Member-Registration
```

### 2. Configure Environment Files

**Backend Environment (`backend/.env`)**:
```env
DEBUG=0
SECRET_KEY=your-production-secret-key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,web
DB_ENGINE=django.db.backends.mysql
DB_NAME=member_registration_db
DB_USER=sacco_user
DB_PASSWORD=sacco_secure_password
DB_HOST=db
DB_PORT=3306
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend Environment (`frontend/package/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
DJANGO_API_URL=http://backend:8000
LOAN_API_URL=https://v1.royalltd.co.ke/lne/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-32-chars-long
```

### 3. Build and Start Services
```bash
docker-compose up --build -d
```

### 4. Run Initial Migrations & Seed Database
```bash
# Run database migrations
docker-compose exec backend python manage.py migrate

# Seed default roles, permissions, categories, and sample data
docker-compose exec backend python manage.py seed_members

# Create Superuser Administrator
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the Platform
* **Web Portal (Next.js)**: [http://localhost:3000](http://localhost:3000)
* **Backend API Documentation**: [http://localhost:8000/api/](http://localhost:8000/api/)
* **Django Admin Console**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 💻 Local Manual Setup (Development Mode)

If you prefer to run services individually without Docker:

### 1. Backend (Django)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows (PowerShell: .\venv\Scripts\Activate.ps1)
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed data
python manage.py migrate
python manage.py seed_members

# Start development server
python manage.py runserver 8000
```

### 2. Frontend (Next.js)
```bash
cd frontend/package

# Install packages via pnpm
pnpm install

# Start Next.js development server
pnpm dev
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) |
| **Frontend Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Component Library** | [Material UI (MUI v6)](https://mui.com/) & [Tabler Icons](https://tabler.io/icons) |
| **Theme / Design** | Custom Emerald Forest Theme (`#064e3b`, `#059669`, `#0d9488`) |
| **State & Authentication** | [NextAuth.js](https://next-auth.js.org/) & Context Providers |
| **Data Visualization** | ApexCharts & React-ApexCharts |
| **Backend Framework** | [Django 6.0](https://www.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/) |
| **Security & OAuth2** | Django OAuth Toolkit & JWT Bearer Tokens |
| **Database** | MySQL 8.0 / PostgreSQL 16 |
| **Containerization** | Docker, Docker Compose, Alpine Nginx |

---

## 📁 Repository Structure

```
member-registration-app/
├── backend/
│   ├── apps/
│   │   ├── authentication/       # OAuth2 authentication & custom user models
│   │   ├── members/              # Member KYC, categories, wizard, and workflows
│   │   ├── organizations/        # Multi-tenant roles & RBAC permission catalog
│   │   └── reports/              # Aggregation engines & summary reports
│   ├── config/                   # Django settings, WSGI/ASGI, URLs
│   ├── Dockerfile                # Production Django Gunicorn container
│   ├── requirements.txt          # Python dependencies
│   └── manage.py
│
├── frontend/
│   └── package/
│       ├── src/
│       │   ├── app/              # Next.js App Router (Dashboard, Loans, Members, Collections)
│       │   ├── components/       # Reusable UI components, modals, and datagrids
│       │   ├── hooks/            # Custom hooks (usePermissions, useLoans, useMembers)
│       │   ├── services/         # Axios API clients
│       │   └── types/            # TypeScript schemas & interfaces
│       ├── Dockerfile            # Production Next.js standalone container
│       └── package.json
│
├── nginx/
│   └── nginx.conf                # Reverse proxy routing config
├── docker-compose.yml            # Multi-container orchestration
├── .gitignore
└── README.md
```

---

## 🔒 Security Best Practices

1. **RBAC Guarding**: All administrative loan actions (*Approve*, *Disburse*, *Reject*, *Delete*) are guarded at both UI and server API route levels.
2. **Audit Accountability**: All lifecycle state transitions record the enacting user's ID and timestamp.
3. **Environment Security**: Never commit `.env` or `.env.local` files containing live credentials.

---

## 👨‍💻 Author & Maintainer

**Kelvin Karanja**  
*Enterprise SACCO & Microfinance Member Registration Management System*  
© 2026 All Rights Reserved.