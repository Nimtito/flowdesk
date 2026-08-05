# FlowDesk 
## Overview
An AI-powered work management and business operations platform built for small and medium-sized businesses. FlowDesk replaces scattered communication across WhatsApp, spreadsheets, notebooks, and emails with a single, centralized workspace where teams can manage projects, tasks, meetings, and daily operations.
---
# Problem Statement
Many small and medium-sized businesses manage their daily work using different tools such as WhatsApp, spreadsheets, notebooks, and emails. This makes it difficult to organize projects, monitor progress, assign responsibilities, and access important information.

FlowDesk Backend solves this problem by providing one centralized system that stores and manages all business data securely.
---
# Solution
FlowDesk provides one reliable platform for managing projects, teams, tasks, meetings, and business operations. Every project, task, comment, notification, and report is stored in one system. AI is used as an assistant to summarize meetings, suggest project tasks, and recommend priorities, while all business decisions remain under the control of users.
---
# Features
## Authentication

- User Registration
- User Login
- User Logout
- Password Reset
- User Profile

## Project Management

- Create Projects
- Update Projects
- Delete Projects
- Archive Projects
- Assign Team Members

## Task Management

- Create Tasks
- Assign Tasks
- Update Task Status
- Set Priorities
- Due Dates
- Track Progress

## Team Collaboration

- Comments
- Notifications
- Activity Logs

## Reports

- Dashboard Statistics
- Project Reports
- Task Reports
- Productivity Reports

## AI Features

- Meeting Summaries
- Task Suggestions
- Priority Recommendations
- Project Summaries

---

# Tech Stack

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Groq/OpenAI API
- Git
- GitHub
# Project Structure

```
backend/
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   ├── wsgi.py
│   └── __init__.py
│
├── apps/
│   ├── projects/
│   ├── tasks/
│   ├── teams/
│   ├── notifications/
│   ├── reports/
├── requirements.txt
├── manage.py
├── .env
└── README.md
```

---

# API Endpoints

## Authentication

```
POST /api/auth/register/
POST /api/auth/login/
GET  /api/auth/profile/
```

## Projects

```
GET    /api/projects/
POST   /api/projects/
GET    /api/projects/{id}/
PATCH  /api/projects/{id}/
DELETE /api/projects/{id}/
```

## Tasks

```
GET    /api/tasks/
POST   /api/tasks/
GET    /api/tasks/{id}/
PATCH  /api/tasks/{id}/
DELETE /api/tasks/{id}/
```

## Notifications

```
GET   /api/notifications/
PATCH /api/notifications/{id}/
```

## Reports

```
GET /api/reports/dashboard/
GET /api/reports/projects/
GET /api/reports/tasks/
```

## AI

```
POST /api/ai/summarize-meeting/
POST /api/ai/task-suggestions/
POST /api/ai/project-summary/
POST /api/ai/prioritize-tasks/

# Installation

## Clone the repository

```bash
git clone https://github.com/nimtito/flowdesk-backend.git
```

## Create a virtual environment

```bash
python -m venv venv
```

## Activate the virtual environment

### Windows

```bash
venv\Scripts\activate
```

## Install dependencies

```bash
pip install -r requirements.txt
```

## Apply migrations

```bash
python manage.py migrate
```

## Create an administrator

```bash
python manage.py createsuperuser
```

## Run the development server

```bash
python manage.py runserver
```
# Environment Variables
Create a `.env` file inside the project root.
SECRET_KEY=

DEBUG=True

DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_HOST=
DATABASE_PORT=

JWT_SECRET_KEY=

AI_API_KEY=
```
# System Workflow
1. The user logs into the application.
2. React sends requests to Django through REST APIs.
3. Django validates the request.
4. Business logic is processed.
5.PostgreSQL stores or retrieves data.
6. Django returns a JSON response.

# Future Improvements
- Calendar Integration
- Email Notifications
- Mobile API
- File Management
- Time Tracking
- Workflow Automation
- Team Chat
- Multi-Organization Support
- Advanced AI Analytics

# License
This project is licensed under the MIT License.