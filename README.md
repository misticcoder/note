# InfCom — Informatics Community Platform

> A centralised community platform for the School of Informatics at the University of Edinburgh, designed to improve discoverability of events and communities, reduce communication fragmentation, and support student engagement.

---

## Overview

InfCom is a web-based platform developed as part of a 4th Year Honours project at the University of Edinburgh. The platform addresses a core problem identified through empirical research with Informatics students: the information about communities, events, and opportunities is fragmented across multiple disconnected platforms — email, Discord, WhatsApp, Microsoft Teams, and static university pages — making it difficult for students to discover and engage with what is available.

InfCom consolidates this information into a single, student-focused hub featuring:

- A centralised event hub with filtering, tagging, and participation tracking
- A community directory with configurable external social links
- Cross-entity global search across events, communities, threads, and posts
- A student-facing discussion thread space for peer interaction
- A controlled announcement feed restricted to organisers and community leaders
- Personalised user profiles with interest tags and participation history
- Organiser and admin tools for content and membership management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Java, Spring Boot |
| Database | MySQL |
| ORM | Spring Data JPA |
| Architecture | MVC-inspired four-tier layered architecture |
| Deployment | Netlify (frontend), Render (backend) |
| Version Control | GitHub |

---

## Project Structure

```
backend/
├── src/main/java/com/vlrclone/backend/
│   ├── config/          # Security, CORS, admin bootstrap
│   ├── controller/      # HTTP request handlers
│   ├── service/         # Business logic
│   ├── repository/      # Spring Data JPA interfaces
│   ├── model/           # Entity classes
│   ├── dto/             # Data transfer objects
│   └── Enums/           # Enumeration types
└── src/main/resources/
    └── application.properties
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven
- MySQL 8+
- Node.js 18+ (for frontend)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR-REPO-LINK
cd backend
```

2. Create a MySQL database:
```sql
CREATE DATABASE infcom;
```

3. Configure environment variables or update `application-local.properties`:
```properties
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/infcom
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
```

4. Run the application:
```bash
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | MySQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `PORT` | Server port (default: 8080) |

---

## Key Features

### For Students
- Browse and filter events by status, time, and tags
- Discover and join communities with configurable social links
- Search across events, communities, threads, and posts simultaneously
- Create and participate in discussion threads
- View personalised event recommendations based on interest tags
- Track participation history and activity

### For Community Leaders
- Create and manage events and community pages
- Post announcements to community members
- Accept or decline membership join requests
- Add external links (WhatsApp, Discord, etc.) to community pages
- Track event attendance and collect feedback

### For Administrators
- Full content management across all platform entities
- Role-based access control across all system modules
- User management and oversight tools

---

## Demonstration Data

The platform was seeded with synthetic demonstration data for evaluation purposes. Profile avatars are sourced from [Pravatar](https://pravatar.cc) and community and event images from [Lorem Picsum](https://picsum.photos). All usernames, display names, bios, and participation records are synthetically generated and do not represent real Informatics students or communities.

Default admin credentials for the seeded environment:
```
Email:    admin@example.com
Password: admin123
```
> ⚠️ These credentials are for prototype/demo use only and should not be used in any production environment.

---

## Academic Context

This platform was developed as the artefact deliverable for a 4th Year BEng Software Engineering dissertation at the School of Informatics, University of Edinburgh (2026). The project investigates what influences Informatics students to engage with community-building activities and what structural barriers prevent them from doing so, developing a grounded theory of student engagement alongside the platform implementation.

**Dissertation title:** Building community in Informatics: how to develop a student support system that UG students want to engage with

---

## License

This project was developed for academic purposes at the University of Edinburgh. All rights reserved.
