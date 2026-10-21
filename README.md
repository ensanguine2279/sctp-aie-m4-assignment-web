# Task Management Portal

A modern, full-stack Next.js web application for organizational task management and user administration. Built on Next.js App Router, Server Actions, and Tailwind CSS, this portal integrates seamlessly with distributed Spring Boot microservices (`TASK_SERVICE_URL` and `USER_SERVICE_URL`) using RS256-signed JWTs for Role-Based Access Control (RBAC).

---

## Key Features

### 📋 Task Registry (`/dashboard/tasks`)

- **Real-time Task Overview**: Displays task title, description, priority badge, assignee name, completion status, and available actions.
- **Search & Multi-Filter**:
  - **Search**: Instant text search across task titles and descriptions.
  - **Priority Filter**: Filter tasks by `LOW`, `MEDIUM`, or `HIGH` priority.
  - **Assignee Filter**: Filter tasks by assignee (Admins and Managers only).
- **Automatic Sorting**: Tasks are automatically sorted in alphabetical order by title (`localeCompare`).
- **Interactive Completion Toggle**: Clickable status toggle for instant completion updates.
- **Role-Restricted Assignees**: Task creation and editing dropdowns filter and present only accounts with the `USER` role, sorted alphabetically.

### 👤 User Directory (`/dashboard/users`)

- **Account Administration**: Administrator-only view to create, edit, and delete system user accounts.
- **Strict Validation Rules**: Client-side and server-side validation for full name, username patterns (`[a-z0-9]+`), password lengths, and system roles (`ADMIN`, `MANAGER`, `USER`).
- **Alphabetical Sorting**: User listings are sorted alphabetically by full name.

---

## Role-Based Access Control (RBAC)

The application enforces strict RBAC across UI components, Server Actions, and backend endpoints:

| Feature / Action               |  `ADMIN`  | `MANAGER`  |     `USER`     |
| :----------------------------- | :-------: | :--------: | :------------: |
| **View Task List**             | All Tasks | All Tasks  | All / Filtered |
| **Search & Priority Filter**   |    Yes    |    Yes     |      Yes       |
| **Filter by Assignee**         |    Yes    |    Yes     |       No       |
| **Toggle Task Completion**     | Any Task  |  Any Task  | Own Tasks Only |
| **Create New Task**            |    Yes    |    Yes     |       No       |
| **Edit Task / Reassign Owner** |    Yes    |    Yes     |       No       |
| **Delete Task**                |    Yes    |    Yes     |       No       |
| **Actions Column Visibility**  |  Visible  |  Visible   |   **Hidden**   |
| **User Directory Management**  | Full CRUD | Restricted |   Restricted   |

---

## Tech Stack

- **Frontend Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React Server Components, Server Actions)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Language**: TypeScript
- **Backend Ecosystem**: Spring Boot Java Microservices (Task Service & User Service)
- **Authentication**: RS256-signed JWTs (Asymmetric Public/Private Key verification with session claims parsing)

---

## Project Architecture & Directory Structure

```text
├── app/
│   ├── dashboard/
│   │   ├── tasks/
│   │   │   ├── page.tsx          # Server Component: Fetches tasks & users
│   │   │   └── task-table.tsx    # Client Component: Filtering, sorting, CRUD modals
│   │   └── users/
│   │       ├── page.tsx          # Server Component: Fetches user directory
│   │       └── user-table.tsx    # Client Component: User management modal & table
│   └── login/
│       └── page.tsx              # Authentication entry point
├── lib/
│   ├── actions/
│   │   ├── tasks.ts              # Server actions for task microservice REST endpoints
│   │   └── users.ts              # Server actions for user microservice REST endpoints
│   └── auth.ts                   # RS256 JWT token verification & claim extraction
├── .env.local                    # Local environment variables (git-ignored)
└── package.json
```

````

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `npm`, `yarn`, or `pnpm`
- **Backend Services**: Active instances of the Task Microservice and User Microservice providing public key verification endpoints or JWKS for RS256 validation.

### 1. Environment Configuration

Create a `.env.local` file in the root directory of the Next.js project:

```env
# Microservice REST Endpoints
TASK_SERVICE_URL=http://localhost:8081
USER_SERVICE_URL=http://localhost:8082

```

> **Note**: If you modify `.env.local` while the development server is active, restart the dev server for Next.js to register updated environment variables.

### 2. Installation

Install project dependencies:

```bash
npm install

```

### 3. Run Development Server

Clear any stale cache and launch the development server:

```bash
# Optional: Clear Next.js build cache if environment variables changed
rm -rf .next

# Start development server
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Form Validation Standards

To ensure data integrity between the Next.js frontend and the Java Spring Boot backend DTOs, the following validation constraints are enforced:

### Task Form Validation

- **Title**: Required (`@NotBlank`)
- **Priority**: Required (`LOW`, `MEDIUM`, `HIGH`)
- **Completed**: Boolean (`true` / `false`)
- **Assignee (`userId`)**: Required (`@NotNull Long userId`), must belong to a user with the `USER` role.

### User Form Validation

- **Full Name**: 2 – 50 characters
- **Username**: 6 – 20 lowercase alphanumeric characters (`pattern="[a-z0-9]+"` required)
- **Password**: 8 – 72 characters
- **Role**: Required (`ADMIN`, `MANAGER`, `USER`)

```

```
````
