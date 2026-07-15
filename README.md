# Member Registration Management System

An enterprise-grade Member Registration Management System developed using Django REST Framework for the backend and Next.js (App Router) with TypeScript and Material UI for the frontend.

The system provides secure authentication, member lifecycle management, configurable registration workflows, audit logging, and a modern web interface.

---

# Technology Stack

## Backend

- Python 3.13+
- Django 6
- Django REST Framework
- Django OAuth Toolkit
- PostgreSQL (Production Ready)
- SQLite (Development)
- OAuth2 Authentication

## Frontend

- Next.js 16 (App Router)
- TypeScript
- Material UI
- NextAuth
- Axios
- pnpm

---

# Project Structure

```
member-registration-app/

├── backend/
│   ├── apps/
│   │   ├── authentication/
│   │   ├── members/
│   │   ├── configuration/
│   │   └── ...
│   ├── config/
│   ├── media/
│   └── manage.py
│
├── frontend/
│   └── package/
│       ├── src/
│       ├── public/
│       └── package.json
│
└── README.md
```

---

# Backend Features

## Authentication

- Custom User Model
- Django OAuth Toolkit
- OAuth2 Password Grant
- Access Token
- Refresh Token
- Protected APIs

---

## Member Management

- Member Registration
- Member Categories
- Member Configuration
- Dynamic Field Configuration
- Next of Kin
- Vehicles
- Guarantors

---

## Business Logic

Implemented using a Service Layer.

- Member Creation
- Member Update
- Member Deletion
- Member Approval
- Member Rejection
- Member Activation
- Member Deactivation
- Member Conversion

---

## Audit Trail

Automatic audit logging for:

- Create
- Update
- Delete
- Approve
- Reject
- Convert

---

## Workflow History

Automatic workflow tracking whenever registration stage changes.

Examples:

```
Pending
↓

Approved
↓

Active
```

---

## Management Command

Seed default application data.

```
python manage.py seed_members
```

Creates:

- Member Categories
- Member Configuration
- Field Configuration

---

# REST APIs

Authentication

```
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/refresh/
GET  /api/auth/me/
```

Members

```
GET
POST
PATCH
DELETE
```

Additional member actions

```
Approve

Reject

Activate

Deactivate

Convert
```

Additional modules

- Member Categories
- Member Configuration
- Field Configuration
- Next Of Kin
- Vehicles
- Guarantors
- Audit Trail
- Workflow History

---

# Frontend Features

Completed

- Modernize Admin Template Integration
- NextAuth Authentication
- Axios API Layer
- Token Refresh
- Protected Routes
- Dashboard Layout
- Member Service
- useMembers Hook
- Member DataGrid
- Member Toolbar
- Delete Member Dialog
- Members Listing Page

---

# Currently In Progress

- View Member
- Edit Member
- Register Member Wizard

Registration Wizard

```
Step 1
Member Details

↓

Step 2
Next Of Kin

↓

Step 3
Vehicle

↓

Step 4
Guarantor

↓

Step 5
Review & Submit
```

---

# Installation

## Backend

```bash
cd backend

python -m venv venv

pip install -r requirements.txt

python manage.py migrate

python manage.py seed_members

python manage.py runserver
```

---

## Frontend

```bash
cd frontend/package

pnpm install

pnpm dev
```

---

# Environment Variables

## Backend

Create

```
backend/.env
```

Configure your database and OAuth settings.

---

## Frontend

Create

```
frontend/package/.env.local
```

Example

```env
DJANGO_API_URL=http://127.0.0.1:8000

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

NEXTAUTH_URL=http://localhost:3000

NEXTAUTH_SECRET=your-secret-key
```

---

# Development Status

## Backend

- Authentication
- OAuth2
- Service Layer
- CRUD APIs
- Audit Logging
- Workflow History
- Seed Command

Status:

Completed

---

## Frontend

- Authentication
- Dashboard Layout
- Member Module Foundation

Status:

In Progress

---

# Future Enhancements

- Reports Dashboard
- Notifications
- Email Integration
- SMS Integration
- File Upload Improvements
- Analytics
- Role-Based Permissions
- Search Optimization
- Export to Excel/PDF
- Dashboard Charts

---

# Author

Kelvin Karanja

Internship Project

Member Registration Management System

2026