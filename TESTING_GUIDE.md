# RecruitFlow Testing Guide

This guide outlines the end-to-end testing procedure for the RecruitFlow Admin Portal. The application supports three primary roles: **Admin**, **Recruiter**, and **Vendor**.

---

## 🚀 Setup & Execution

### 1. Backend
- Navigate to `/backend`.
- Ensure your virtual environment is active.
- Run the server: `uvicorn app.main:app --reload`.
- Default API URL: `http://localhost:8000`.

### 2. Frontend
- Navigate to `/frontend`.
- Run the dev server: `npm run dev`.
- Default URL: `http://localhost:5173`.

---

## 👤 Role 1: Admin
**Credentials**: `admin@shivaay.com` / `Admin@123`

### User Management
- [ ] **Login**: Sign in and verify you land on the Users page.
- [ ] **Create User**: Click "Create User". Fill in details for a new Recruiter or Vendor.
- [ ] **Edit User**: Click "Edit" on an existing user, change their name or role, and save.
- [ ] **Deactivate**: Click "Deactivate" and confirm. Verify the status badge changes to "Inactive".

### Vendor Management
- [ ] **List**: Navigate to "Vendors" in the sidebar.
- [ ] **Approval Flow**: Find a "Pending" vendor. Click "Approve" and confirm.
- [ ] **Revoke**: Click "Revoke" on an approved vendor to test the reverse flow.

---

## 👤 Role 2: Recruiter
**Credentials**: *(Create one via Admin portal)*

### Job Description (JD) Lifecycle
- [ ] **Create JD**: Navigate to "Job Descriptions" and click "Create JD".
- [ ] **View Detail**: Click "View" on a JD to see the full description.
- [ ] **Update Status**: On the detail page, change the status (e.g., from `received` to `sourcing`).
- [ ] **Float JD**: 
    - In the "Float to Vendors" section, enter a valid Vendor ID (found in the Admin Vendor list).
    - Click "Float JD".
    - Verify the vendor appears in the "Vendor Assignments" table below.

---

## 👤 Role 3: Vendor
**Credentials**: `Vendor@acme.com` / `Admin@123` *(Ensure the vendor is "Approved" by Admin first)*

### Assignment Workflow
- [ ] **My Assignments**: Log in and verify you see "Job Descriptions" assigned to you.
- [ ] **Acknowledgment**:
    - Open a JD detail page.
    - Click "Acknowledge Assignment".
    - Verify the button is replaced by a green "Acknowledged ✓" indicator.
- [ ] **CV Submission**:
    - Click "Submit CV" (only available for Active JDs).
    - Fill in candidate details and attach a `.pdf` or `.docx` file.
    - Submit and verify the success toast appears.

### Submission History
- [ ] **View History**: Navigate to "My Submissions".
- [ ] **Verify Candidate**: Check that your recently submitted candidate appears in the list.
- [ ] **View CV**: Click the external link icon under the "CV" column to open the uploaded file.

---

## 🛠️ General Features & Edge Cases

### 1. Security & Guards
- [ ] **Unauthorized Access**: Try navigating directly to `http://localhost:5173/admin/users` while logged in as a Vendor. It should redirect you to your dashboard.
- [ ] **Persistence**: Refresh the page. You should remain logged in.

### 2. Error Handling
- [ ] **Invalid Login**: Try logging in with a wrong password. Verify the error message appears.
- [ ] **404 Page**: Navigate to a non-existent route like `/something-random`. Verify the custom 404 page is shown.

---

## 📈 Final Verification Check
- [x] Admin approves vendor.
- [x] Recruiter creates JD.
- [x] Recruiter floats JD to approved vendor.
- [x] Vendor acknowledges JD.
- [x] Vendor submits CV.
- [x] Recruiter/Admin can see the submission in the JD detail view.
