# Robotics Club — Component Management System

A production-ready full-stack web application designed for college robotics clubs to manage electronic components, lab inventory, multi-item member requests, senior peer reviews, physical checkout/issuance, damage logging, and returns.

![Dashboard Preview](Robotics%20Club%20Component%20Inventory%20Dashboard.png)

---

## 🌟 Key Features

1. **Faithful Laboratory UI / UX**:
   - **Dark Navy Header & Hero (`#0B132B`)**: Circuit board backdrop with *"Find, Request, Build Your Ideas"*.
   - **Laboratory Coordinates**: Physical storage mapping hierarchy `(Rack, Shelf, Box)` (e.g. `Coords: (A,1,02)`).
   - **Catalog & Component Cards**: High-res photos, real-time stock counters, datasheets, pinout specs, and quick `+ Request` buttons.
   - **Sidebar Panels**: *"Request a Component"*, 4-step *"How It Works?"* stepper, and *"Example Location Format"* callouts.

2. **4 User Roles & Quick Live Switcher**:
   - **Member / Student**: Discovery, cart request builder, project association, and live timeline tracking.
   - **Senior / Approver**: Review queue, live stock checks, full approval, partial approvals with quantity adjustments, and rejection comments.
   - **Inventory Manager**: Physical issuance confirmation, return processing with damage logging, manual stock adjustments with audit reasons, and CSV export.
   - **Administrator**: User directory, role assignment, account suspension, robotics project tracking, maintenance tickets, and analytics.
   - *⚡ Built-in Quick Role Switcher*: Switch between roles in 1 click in the top-right profile dropdown to immediately evaluate all 4 user perspectives!

3. **Concurrency-Safe Stock Management**:
   - Invariant: $\text{Total Stock} = \text{Available} + \text{Reserved} + \text{Issued} + \text{Damaged}$.
   - Atomic database operations ensure available stock can never drop below zero.
   - Immutable audit ledger (`inventory_transactions`) records every stock movement.

4. **Database: MongoDB Atlas + Future Neon DB Ready**:
   - Operates with **MongoDB Atlas** via Mongoose models.
   - Features a built-in local persistence engine so you can run and test the application immediately even before configuring your MongoDB Atlas connection string!
   - Structured with clean relational models and transactional repository patterns to allow effortless migration to **Neon DB (PostgreSQL)** later.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js (v18+) & npm

### 2. Configure Environment (`.env`)
Create or edit the `.env` file in the root directory:
```env
# Optional: Paste your MongoDB Atlas URI here (or leave blank to use the built-in local persistent store)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/robo_stock?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=robotics_club_super_secure_jwt_key_2026_production
FRONTEND_PORT=5173
```

### 3. Start Backend Server
```bash
cd backend
npm install
node src/server.js
```
The server will start on `http://localhost:5000` and automatically seed all demo users, robotics components, and initial projects!

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 👥 Pre-Seeded Demo Accounts

You can log in with any of these accounts or use the **Quick Role Switcher** in the top navigation profile dropdown:

| Role | Name | Email | Password | Membership ID |
| :--- | :--- | :--- | :--- | :--- |
| **Student / Member** | Mittal Patel | `mittal@robotics.club` | `password123` | `ROBO-2026-042` |
| **Senior Approver** | Aryan Sharma | `aryan@robotics.club` | `password123` | `ROBO-2025-011` |
| **Inventory Manager** | Dr. Rajesh Verma | `manager@robotics.club` | `password123` | `LAB-MGR-002` |
| **Administrator** | Prof. Ananya Iyer | `admin@robotics.club` | `password123` | `FAC-ADV-001` |

---

## 🔄 End-to-End Workflow Demonstration

1. **Browse & Request (Student)**:
   - On the homepage, click **"+ Request"** on any component (e.g. *Arduino Uno*, *Ultrasonic Sensor*).
   - In the slide-out drawer, select your project (*Combat Robowar Titan*), specify your testing purpose, pick your Senior Approver, and click **"Send Permission Request"**.
2. **Review & Approve (Senior)**:
   - Switch role to **Senior Approver** from the top right profile dropdown.
   - Navigate to **Senior Approvals** to see the pending request.
   - Click **"Approve"** (or **"Partial"** to adjust quantities) and submit your decision with comments. Stock is now atomically reserved!
3. **Physical Checkout (Inventory Manager)**:
   - Switch role to **Inventory Manager** and click **Inventory Manager** in the navbar.
   - Under **"Ready for Pickup"**, click **"Confirm Physical Checkout & Handover"** when the student arrives at the lab.
4. **Return & Damage Inspection (Inventory Manager)**:
   - Once testing is done, go to **"Process Returns"**.
   - Inspect components, mark condition as *Good* (restocks to available) or *Damaged* (transfers to damaged stock and auto-generates a maintenance ticket).
5. **Interactive Lab Map & QR Generator**:
   - Open **Lab Storage Map** to view the physical Rack $\rightarrow$ Shelf $\rightarrow$ Box layout and print QR code stickers for component bins.
6. **Analytics & Reports**:
   - View real-time database charts for stock distribution, category breakdowns, and low-stock reorder warnings.
