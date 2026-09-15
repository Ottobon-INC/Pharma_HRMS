# Orca Labs — Pharma HRMS & Field Force Portal

Production-ready Progressive Web Application (PWA) for Orca Labs Pharmaceutical Field Force, Attendance, Doctor Visits, Team Hub, and Work Assignments.

---

## 🚀 Quick Start on Ubuntu Linux VPS (Docker)

### 1. Clone & Enter Directory
```bash
git clone <YOUR_GIT_REPO_URL>
cd pharma_HRMS
```

### 2. Optional Environment Setup
A `.env.example` file is included with pre-configured defaults. If you want to customize ports or keys:
```bash
cp .env.example .env
```

### 3. Build & Run with Docker Compose
```bash
docker compose up -d --build
```

### 4. Verify Container Status
```bash
docker compose ps
docker compose logs -f
```

The application will be live at:
```text
http://<YOUR_VPS_IP>:9590
```

---

## 📱 Production HTTPS & Domain (Recommended for PWA)

To allow employees to install the PWA on mobile phones, serve the app over HTTPS.

If using a domain with Nginx Reverse Proxy & Certbot on your VPS:
```nginx
server {
    server_name hrms.orcalabs.in;

    location / {
        proxy_pass http://127.0.0.1:9590;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Then issue SSL via Let's Encrypt:
```bash
sudo certbot --nginx -d hrms.orcalabs.in
```

---

## 🗄️ Database Setup & Reset
All database schemas and initial migration scripts are in `database/`:
- **Pristine Client Handover Reset**: `database/08_client_handover_reset.sql`
- **Team Hub Approvals Migration**: `database/07_team_hub_migration.sql`
- **Official 35 Personnel Seed**: `database/02_seed_pharma_hrms_employees.sql`
