# AncaTrack: Antenatal Care Clinical Decision Support Platform

AncaTrack is a web-based clinical decision support tool designed for doctors in Rwandan district hospitals. It aggregates blood pressure, proteinuria, and gestational age data collected during routine antenatal care (ANC) visits, detects dangerous BP trajectories using WHO threshold rules, and generates automated pre-eclampsia risk alerts on a doctor-facing dashboard. The system also computes a weighted 0–100 risk score per patient based on six clinical factors, and supports bulk visit import via Excel/CSV upload.

---

## Live Deployment

**Frontend (main app):** https://ancatrack-frontend.onrender.com

**Backend API:** https://ancatrack-backend.onrender.com/api/health



---

## Demo Login Credentials

| Role   | Email                        | Password     |
|--------|------------------------------|--------------|
| Doctor | a.uwase@bugesera.rw          | password123  |
| Nurse  | j.mutesi@bugesera.rw         | password123  |
| Admin  | admin@bugesera.rw            | password123  |

---

## Demo Video

[Watch the 5-minute demo on drive](https://drive.google.com/drive/folders/1l7zGBtEahQZqtBwJItAF9yNGh1DpsuM3?usp=sharing)


---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React, TypeScript, Vite, Chart.js                   |
| Backend    | Node.js, Express, TypeScript                        |
| Database   | MongoDB (Atlas cloud), Mongoose                     |
| Auth       | JWT + bcrypt                                        |
| Deployment | Render (backend Web Service + frontend Static Site) |


---

## Local Installation and Setup

### Prerequisites

- Node.js
- MongoDB running locally (for local dev), or use the Atlas URI directly
- Git

---

### Step 1: Clone the repository

```bash
git clone https://github.com/aineza1/ancatrack.git
cd ancatrack
```

---

### Step 2: Set up the backend

```bash
cd backend
npm install
```

Seed the database with demo users and patients:

```bash
npm run seed
```

Start the backend dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`. Verify with: http://localhost:5000/api/health
Expected: `{"status":"ok","env":"development"}`

---

### Step 3 — Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
VITE_API_URL=http://localhost:5000/api

Start the frontend dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

### Step 4: Log in

Open `http://localhost:5173` in your browser and log in with:
Email: a.uwase@bugesera.rw
Password: password123
---

## Core Features

**BP Trajectory alerting:** automatically detects dangerous blood pressure rises across ANC visits using WHO threshold rules (diastolic rise ≥15 mmHg from baseline, systolic ≥140 mmHg, or either combined with proteinuria ≥1+). Alerts are stored in MongoDB and shown on the doctor dashboard and individual patient pages.

**Pre-eclampsia risk score:** computes a weighted 0–100 score per patient across six clinical factors: BP trajectory (30 pts), absolute BP threshold (25 pts), proteinuria (20 pts), parity (10 pts), velocity of BP rise (10 pts), and maternal age (5 pts). Score is displayed with a visual breakdown and band classification (Low / Medium / High).

**Doctor dashboard:** shows live stats (total patients, high-risk count, unresolved alerts), a BP overview chart for all assigned patients with WHO threshold markers, an active alerts section, and a recent patients table.

**Patient detail view:** full visit history, BP trend chart (line/bar toggle) with WHO danger-zone lines, alert banners with acknowledge and escalate actions, risk score card, and patient info.

**CSV/Excel bulk import:** nurses can upload a `.xlsx` or `.csv` file of multiple patient visits at once. The system matches existing patients by name and date of birth, creates new patient records for unrecognized entries, validates each row, runs the alert engine automatically after import, and returns a row-by-row result summary.

**Role-based access control:** doctors see only their assigned patients; nurses can register patients and record visits; admins manage user accounts. JWT authentication protects all API endpoints.

**Admin panel:** create new users, assign roles (doctor/nurse/admin), and activate or deactivate accounts.

**Responsive design:** TopNav collapses to a hamburger menu on mobile; patient detail and risk score card adapt to narrow screens.

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Authenticated | Current user |
| GET | `/api/patients` | Authenticated | List patients (filtered by doctor) |
| GET | `/api/patients/:id` | Authenticated | Patient detail + active alerts |
| POST | `/api/patients` | Nurse/Admin | Register new patient |
| POST | `/api/patients/:id/visits` | Nurse/Admin | Record a visit |
| GET | `/api/alerts` | Authenticated | Active alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Doctor/Admin | Acknowledge alert |
| PATCH | `/api/alerts/:id/escalate` | Doctor/Admin | Escalate to specialist |
| POST | `/api/import` | Nurse/Admin | Bulk import visits from Excel/CSV |
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create new user |
| PATCH | `/api/users/:id/toggle` | Admin | Activate/deactivate user |
| GET | `/api/health` | Public | Health check |

---

## Deployment

The application is deployed on Render using a monorepo structure:

**Backend:** Render Web Service
- Root Directory: `backend`
- Build: `npm install && npm run build`
- Start: `npm start`
- Environment: MongoDB Atlas, JWT secret, `NODE_ENV=production`

**Frontend:** Render Static Site
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Environment: `VITE_API_URL` pointing to the backend service URL

Database is hosted on MongoDB Atlas with network access open to all IPs

---

## CSV Import Format

To use the bulk import feature, prepare an Excel or CSV file with these exact column headers in row 1:

| Column | Description | Example |
|--------|-------------|---------|
| `patientName` | Full name | Mwiza Angel |
| `dob` | Date of birth | 12/03/1996 |
| `edd` | Estimated due date | 14/09/2026 |
| `parity` | Pregnancy history | G2P1 |
| `insurance` | Insurance type | Mutuelle |
| `visitDate` | Date of visit | 20/06/2026 |
| `ga` | Gestational age (weeks) | 28 |
| `sbp` | Systolic BP (mmHg) | 136 |
| `dbp` | Diastolic BP (mmHg) | 88 |
| `proteinuria` | None / Trace / 1+ / 2+ / 3+ | 1+ |
| `weight` | Weight (kg) | 65 |
| `notes` | Optional notes | — |

---

## Testing

The following tests were conducted on the live deployed version at
https://ancatrack-frontend.onrender.com

---

### 1. Authentication and Security

**Valid login accepted**
- Action: Logged in as `a.uwase@bugesera.rw / password123`
- ![Valid login](testing/valid%20credentials.png)
-  JWT authentication works end to end

---

### 2. Alert Engine: Core Algorithm with Different Data Values

**High risk: combined pre-eclampsia criteria correctly detected**
- Action: Opened Mwiza Angel's patient detail page
- ![Red alert banner, risk score HIGH band, combined risk flag](testing/high-risk-alert.png)
- **What it shows:** Alert engine correctly identifies 18mmHg DBP rise from
  baseline combined with 1+ proteinuria as meeting WHO pre-eclampsia
  diagnostic criteria — the two conditions together trigger COMBINED_RISK
  severity, not just medium

**Low risk: no false positive for stable readings**
- No alert banner, LOW risk score, green status indicator
- ![Low risk score](testing/low-risk-score.png)
- What it shows: Alert engine correctly produces no alert for a patient
  within normal ranges, system avoids false positives which would reduce
  clinical trust

---

### 3. Role-Based Access Control

**Doctors see only their own assigned patients**
- Action: Logged in as Dr. Uwase (Tab 1) and Dr. Jean Bosco (Tab 2) simultaneously
- Expected: Each doctor sees a different patient list
- ![Each doctor sees a different patient list](testing/role-patient-filtering.png)
- What it shows: Patient filtering is enforced at the API level —
  `GET /api/patients` applies an `assignedDoctor` filter server-side,
  not just on the frontend

**Doctor role blocked from Admin page**
- Action: Logged in as Dr. Uwase, navigated to `/admin`
- ![Access denied message](testing/access%20denied.png)
- What it shows: 'You do not have permission for this action.' access denied


---

### 4. Performance Across Hardware and Software Environments

**Chrome on Windows (desktop)**

- Expected: Full functionality, all pages load correctly
- ![Access denied message](testing/live%20site%20on%20desktop.png)
- What it shows: Primary browser compatibility

**Mobile responsive layout**
- menu in TopNav, single-column stacked layout on patient detail
- ![mobile responsiveness](testing/mobile%20responsiveness.png)
- What it shows: Responsive design adapts correctly to narrow
  viewports; useIsMobile hook triggers layout changes at 768px
  breakpoint, tested at 12 Pro width

## Analysis of results

AncaTrack was built around three objectives from the proposal: detect
dangerous BP trajectories automatically, surface risk to doctors at the
point of care, and reduce the manual data entry burden.

**BP trajectory detection** The alert engine correctly flags
diastolic rises of 15mmHg or more from baseline, systolic readings above
140mmHg, and the combined pre-eclampsia pattern of elevated BP with
proteinuria. Testing confirmed no false positives for patients with stable
readings and correct high-severity classification for patients meeting WHO
criteria.

**Clinical decision support at point of care** The dashboard,
patient detail page, and live alert preview all surface risk information
at the moment it is needed. Doctors can acknowledge or escalate alerts
directly, and every action is recorded with a timestamp.

**Reducing manual data entry** The CSV bulk import
removes the one-by-one bottleneck for batch visits. However, the current
version requires exact column names, which may not match every hospital's
file format. Flexible column mapping is actively in development to
address this.

**Overall scope alignment:** All core features defined in the proposal
are implemented and live; alerting, risk scoring, dashboard, patient
records, role-based access, and admin management. The system runs in a
standard browser with no installation, matching the proposal's deployment
constraint for district hospital computers.

---

## Discussion


The risk score is the feature that most directly answers the
ask for something beyond basic data capture. It combines six clinical
factors into a transparent, explainable score that a doctor can walk a
patient through, which matters for adoption, since clinicians don't act
on scores they can't explain.

The CSV import addressed a real workflow problem identified during
development, a nurse recording 10 visits one by one is a bottleneck
that discourages use. One upload replacing ten form submissions is the
kind of workload reduction the literature review identified as critical
for digital health tool adoption in Rwanda.

One limitation: the hosting tier introduces a cold-start
delay of up to a few seconds after inactivity, which is not acceptable in
a live clinic. Before real deployment, this would need to
be resolved through a better hosting plan or local server installation
at the facility.

## Recommendations and Future Work

The following features are actively in development and will be added
before the final defense:

**Trajectory projection:** instead of alerting only after a threshold
is crossed, the system will project where a patient's BP is heading
and warn the doctor before the danger point is reached.

**SMS notifications:** when a high-risk alert fires, the assigned
doctor and the patient automatically receive an SMS via Africa's Talking.
Works on any MTN or Airtel Rwanda phone, no internet needed.

**Patient portal:** a simplified login using phone number and PIN
where patients can view their own BP readings, next visit date, and
risk status in plain language from any browser.

**USSD interface:** for patients with basic phones and no data plan,
a menu-driven session giving access to their last BP reading and next appointment without needing a smartphone.

**Flexible CSV column mapping:** the import engine will recognize
common column name variations across different hospital file formats,
making bulk upload more robust.

