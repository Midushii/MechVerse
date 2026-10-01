<div align="center">

# ⚙️MechVerse

A one-stop academic companion for Mechanical Engineering students: curated study resources, a smart grade planner, lab preparation material, and an instant SGPA calculator, all in one place.

[![Live Site](https://img.shields.io/badge/Live-mechverse--igdtuw.vercel.app-2f8f7a?style=for-the-badge&logo=vercel&logoColor=white)](https://mechverse-igdtuw.vercel.app/)
![Node](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**🌐 [mechverse-igdtuw.vercel.app](https://mechverse-igdtuw.vercel.app/)**

<img src="frontend/assets/7.png" width="860" alt="MechVerse home page">

<em>The MechVerse landing page </em>

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [Application Walkthrough](#4-application-walkthrough)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Database Design](#7-database-design)
8. [Repository Structure](#8-repository-structure)
9. [Developers](#9-developers)


---

## 1. Overview

**MechVerse** is a full-stack web platform built for Mechanical Engineering students at **IGDTUW**. It brings together everything a student needs during a semester: notes, previous-year question papers (PYQs), videos, syllabus, lab files, marks tracking, and grade calculation, behind a single, consistent and personalised interface.

The platform is organised around four core modules:

| Module | Purpose |
|---|---|
| 📚 **Resource Hub** | Semester-wise subjects with unit-wise notes, PYQs, videos and syllabus, plus progress tracking and bookmarks |
| 🗓️ **Grade Planner** | Enter marks, see the predicted grade, set a target grade, and find out exactly what marks are needed to reach it |
| 🧪 **Lab Companion** | Lab files and viva questions for every lab, organised by semester |
| 🧮 **SGPA Calculator** | Calculate SGPA in seconds using the university's grading regulation |

---

## 2. Problem Statement

Study material for a single semester is typically scattered across WhatsApp groups, Google Drive folders, seniors' hand-me-downs, and individual notebooks. Students also have to calculate their grade standing manually, without knowing how much they must score in the end-semester exam to reach a target grade.

MechVerse addresses this by providing:

1. **One organised home** for all semester resources, structured subject → unit → resource.
2. **A transparent grading tool** that converts raw marks into a predicted grade and works backwards from a target grade to the marks required.
3. **A lab-preparation space** so that lab files and viva questions are never hunting-and-searching affairs.
4. **A personalised experience** with progress tracking, bookmarks, a study streak, and selectable themes.

---

## 3. Key Features

### Resource Hub
- Semester selector (Semesters 1–8) with a **subject dashboard** per semester
- **Study roadmap** per subject: Unit 1 → Unit N, followed by **PYQs** and **Syllabus**
- Resource types include **notes, videos, and PYQs**, each linked to Google Drive or external sources
- **Per-resource progress tracking** with completion percentages rolled up at unit, subject and dashboard level
- **Continue Learning** shortcut for recently viewed units and subjects
- **Bookmarks** for quick access to saved resources
- **Global search** across notes and PYQs
- 🔥 **Study streak** counter to encourage consistent revision

### Grade Planner
- Per-subject assessment components: **Mid Semester (/30)**, **Internal Marks (/10)**, **End Semester (/60)**, and **Lab Practical Marks (/30)** where the subject has a lab
- Slider + numeric input for every component
- Instant **predicted letter grade** and total marks
- **Target grade selector** (A+ through D)
- **Reverse prediction** choose Internals or End Semester and get the marks needed to hit the target
- Target and marks are saved per user and per course
- **Historical comparison** endpoint for benchmarking against earlier batches

### Lab Companion
- Semester-wise list of labs
- Per-lab files and viva-question material served through shareable links
- Admin-managed students always see the latest uploaded content

### SGPA Calculator
- Choose a semester, select subjects, enter marks and credits
- Automatic **marks → letter grade → grade point** conversion
- Weighted SGPA computed on **Calculate SGPA**
- Built-in **Grading Regulation** reference table (marks range, letter grade, grade point)

### Personalisation & Experience
- **Four themes:** Clean Girl Era ✨, Soft Girl Era 🎀, Baddie Era 🖤, and a fully customisable **Creator Era** 🎨 (pick your own background and accent colour)
- Time-aware greeting (*"Good evening, Midushi"*) and animated intro
- Notification bell, back-to-top button, and smooth responsive layouts

### Accounts & Access
- Registration and login with JWT-based sessions
- **Forgot-password / reset-password** flow via email (Brevo)
- **Guest preview** course, subject and lab listings are publicly visible; full content requires login
- **Role-based access** admin accounts (configured by email) unlock the admin panel

---

## 4. Application Walkthrough

### 4.1 Home

The landing page greets the signed-in student and presents the four core modules as entry cards.

<p align="center">
  <img src="frontend/assets/7.png" width="860" alt="Home page">
</p>

### 4.2 Resource Hub — Semester Dashboard

A semester dropdown, a streak counter, and a search bar sit above the **Continue Learning** and **Bookmarks** shortcuts. Each subject card shows its progress ring and a *Continue* action.

<p align="center">
  <img src="frontend/assets/1.png" width="860" alt="Resource Hub semester dashboard">
</p>

### 4.3 Resource Hub — Subject Roadmap

Opening a subject (here, **Applied Mathematics**) reveals a colour-coded **study roadmap**: units in order, followed by PYQs and Syllabus, each with its own progress bar.

<p align="center">
  <img src="frontend/assets/2.png" width="860" alt="Subject study roadmap">
</p>

### 4.4 Grade Planner — Subject Selection

Every subject for the chosen semester appears as a card with its current completion status.

<p align="center">
  <img src="frontend/assets/3.png" width="860" alt="Grade planner subject selection">
</p>

### 4.5 Grade Planner — Predict & Plan

Marks are entered through sliders or number fields. The **predicted grade** updates immediately (for example, 18/30 + 7/10 + 41/60 = **66/100 → C+**). The student then selects a target grade and chooses whether to predict the **Internals** or **End Semester** marks required.

<p align="center">
  <img src="frontend/assets/4.png" width="860" alt="Grade predictor">
</p>

### 4.6 Lab Companion

Labs are grouped by semester (shown here for Semester 3), each opening into its lab files and viva questions.

<p align="center">
  <img src="frontend/assets/8.png" width="860" alt="Lab companion">
</p>

### 4.7 SGPA Calculator

Subjects, marks and credits go in; letter grade and grade point are filled automatically. The **Grading Regulation** table below documents the university's marks-to-grade mapping.

<p align="center">
  <img src="frontend/assets/6.png" width="860" alt="SGPA calculator">
</p>

**Grading regulation used by the calculator**

| Marks range | Letter grade | Grade point |
|:---:|:---:|:---:|
| 93 – 100 | A+ | 10 |
| 85 – 92 | A | 9 |
| 77 – 84 | B+ | 8 |
| 69 – 76 | B | 7 |
| 61 – 68 | C+ | 6 |
| 53 – 60 | C | 5 |
| 45 – 52 | D | 4 |

```
SGPA = Σ (Grade Point × Credits) / Σ Credits
```

---

## 5. System Architecture

MechVerse follows a simple, deployment-friendly architecture: a static multi-page frontend and a single Express API served from the same origin.

```
┌──────────────────────────┐          ┌───────────────────────────────┐
│        Browser           │          │          Vercel               │
│  HTML · CSS · Vanilla JS │ ───────► │  Static files  (/frontend)    │
│  (frontend/)             │          │  /api/*  ──►  api/index.js    │
└──────────────────────────┘          │               (Express app)   │
                                      └───────────────┬───────────────┘
                                                      │
                          ┌───────────────────────────┼─────────────────────────┐
                          ▼                           ▼                         ▼
                 ┌─────────────────┐       ┌────────────────────┐    ┌────────────────────┐
                 │ Postgres (Neon) │       │    Google Drive    │    │   Brevo (email)    │
                 │ users, subjects │       │ notes · PYQs ·     │    │ password-reset &   │
                 │ marks, labs ... │       │ lab files (links)  │    │ welcome emails     │
                 └─────────────────┘       └────────────────────┘    └────────────────────┘
```
---

## 6. Technology Stack

**Frontend**
HTML5 · CSS3 (custom design tokens and theming) · Vanilla JavaScript · Google Fonts

**Backend**
Node.js 22 · Express 4 · JSON Web Tokens (`jsonwebtoken`) · `bcryptjs` · `express-validator` · `express-rate-limit` · `helmet` · `cors` · `cookie-parser` · `dotenv`

**Database**
PostgreSQL hosted on **Neon** (via `pg`), with a one-time migration path from the original SQLite version

**Services & Hosting**
Vercel (hosting and serverless API, `sin1` region) · Brevo (transactional email) · Google Drive (file storage) · Google Apps Script (Drive file listing helper)

---

## 7. Database Design

The schema is defined in `backend/src/config/schema.js` and created with `npm run db:init`.

| Domain | Tables |
|---|---|
| **Authentication** | `users`, `password_reset_tokens` |
| **Resource Hub** | `subjects`, `units`, `resources`, `resource_progress`, `bookmarks`, `recently_viewed`, `recently_viewed_subjects` |
| **Grade Planner** | `courses`, `assessment_components`, `student_marks`, `grade_targets`, `historical_records` |
| **Lab Companion** | `labs`, `lab_files` |

**Relationships (simplified)**

```
subjects ──< units ──< resources ──< resource_progress >── users
                          │                                   │
                          └──────< bookmarks >────────────────┤
                                                              │
courses ──< assessment_components ──< student_marks >─────────┤
   └──< grade_targets >───────────────────────────────────────┘

labs ──< lab_files
```

Cascading deletes keep data consistent: removing a subject removes its units and resources, and removing a user removes their progress, bookmarks, marks and targets.

---

## 8. Repository Structure

```
mechverse/
│
├── api/
│   └── index.js                  Vercel entry point (wraps the Express app)
│
├── frontend/                     The website, served as-is
│   ├── index.html                Sign in / register
│   ├── intro.html                Animated wordmark intro
│   ├── home.html                 Landing page
│   ├── dashboard.html            Resource Hub — semester dashboard
│   ├── subject.html              Subject study roadmap
│   ├── unit.html                 Unit resources
│   ├── grade-planner.html        Grade Planner
│   ├── lab-companion.html        Lab Companion
│   ├── sgpa-calculator.html      SGPA Calculator
│   ├── admin.html                Admin panel (add / edit content)
│   ├── reset-password.html       Password reset
│   ├── assets/                   Logo, favicon and README screenshots
│   ├── css/style.css             Global styles and design tokens
│   └── js/
│       ├── api.js                API client
│       ├── config.js             API base URL + favicon
│       ├── nav.js                Shared navigation bar
│       ├── theme.js              Four-theme system + Creator Era
│       ├── streak.js             Daily study streak
│       ├── sgpa.js               SGPA calculation logic
│       ├── ui-helpers.js         Shared UI utilities
│       ├── back-to-top.js        Scroll-to-top button
│       └── wordmark-intro.js     Intro animation
│
├── backend/
│   ├── src/
│   │   ├── app.js                Express app (middleware + routes)
│   │   ├── server.js             Local server entry
│   │   ├── config/               Database connection and schema
│   │   ├── controllers/          auth, resource, grade, lab logic
│   │   ├── routes/               Route definitions
│   │   ├── middleware/           auth, validation, rate limiting, upload
│   │   ├── utils/                asyncHandler, mailer
│   │   └── seed/seed.js          Sample data
│   ├── scripts/                  init-db and migration scripts
│   └── .env.example              Environment variable template
│
├── tools/
│   └── list-drive-files.gs       Google Drive file-listing helper
│
├── vercel.json                   Hosting, redirects and API rewrites
├── package.json
└── README.md
```

---
## 9. Developers

**Thoughtfully Built By**

| Name | Role |
|---|---|
| **Midushi Maheshwari** | B.Tech. Electronics and Communication Engineering (AI), IGDTUW |
| **Mehakpreet Kaur** | B.Tech. Electronics and Communication Engineering (AI), IGDTUW |
| **Aditi Vaidwan** | B.Tech. Mehanical Engineering , IGDTUW |

Contact: [midushi.maheswari@gmail.com](mailto:midushi.maheswari@gmail.com)

---
 **[Visit MechVerse →](https://mechverse-igdtuw.vercel.app/)**

</div>
