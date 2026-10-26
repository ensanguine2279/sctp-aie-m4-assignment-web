# Task Management Portal

The Task Management Portal is built using a Backend-for-Frontend (BFF) architecture with Next.js App Router, Tailwind CSS, and TypeScript. It communicates with two distributed Spring Boot microservices (`TASK_SERVICE_URL` and `USER_SERVICE_URL`) using asymmetric RS256-signed JSON Web Tokens (JWT) for authentication and Role-Based Access Control (RBAC).

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client_Tier ["Client Tier"]
        Client["Browser / Client UI"]
    end

    subgraph NextJS_Tier ["Next.js Application Tier (BFF)"]
        Middleware["Next.js Middleware / Session Validator"]
        RSC_Tasks["app/dashboard/tasks/page.tsx<br/>Server Component"]
        RSC_Users["app/dashboard/users/page.tsx<br/>Server Component"]
        SA_Tasks["lib/actions/tasks.ts<br/>Server Actions"]
        SA_Users["lib/actions/users.ts<br/>Server Actions"]
        AuthUtil["lib/auth.ts<br/>RS256 Claims Parser"]
    end

    subgraph Backend_Tier ["Spring Boot Microservices"]
        TaskService[("Task Microservice<br/>:8081")]
        UserService[("User Microservice<br/>:8082")]
    end

    Client -->|"1. HTTP Page Requests"| Middleware
    Middleware -->|"2. Validates RS256 Token"| AuthUtil
    Middleware -->|"3. Route Request"| RSC_Tasks
    Middleware -->|"3. Route Request"| RSC_Users

    Client -->|"4. Interactive Form Submissions"| SA_Tasks
    Client -->|"4. Interactive Form Submissions"| SA_Users

    RSC_Tasks -->|"Fetch Tasks"| TaskService
    RSC_Tasks -->|"Fetch Users"| UserService
    RSC_Users -->|"Fetch User Directory"| UserService

    SA_Tasks -->|"POST / PUT / DELETE / PATCH"| TaskService
    SA_Users -->|"POST / PUT / DELETE"| UserService

```

---

## 2. Key Features

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

## 3. Authentication & Authorization Sequence (RS256 JWT)

Authentication relies on RS256 asymmetric signatures (Public/Private key pair). The Next.js server verifies token signatures and extracts session claims (`userId`, `username`, `role`) before executing Server Actions or rendering components.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser)
    participant Next as Next.js Server (BFF)
    participant Auth as Auth Handler (lib/auth.ts)
    participant TaskAPI as Task Microservice (:8081)

    User->>Next: Navigate to /dashboard/tasks (Cookie: session_token)
    Next->>Auth: Decode & Verify RS256 JWT Token
    Auth-->>Next: Extracted Session (userId: 42, role: 'USER')

    alt Valid Authorization Token
        Next->>TaskAPI: GET /api/tasks (Header: Authorization: Bearer #lt;token#gt;)
        TaskAPI-->>Next: Returns 200 OK + Task Dataset JSON
        Next-->>User: Render Task Table (Actions Column & Create Button hidden for USER role)
    else Invalid or Expired Token
        Auth-->>Next: Verification Failure / Token Expired
        Next-->>User: Redirect to /login
    end

```

---

## 4. Microservice REST API Integration

### 4.1 Task Microservice (`TASK_SERVICE_URL`)

```mermaid
flowchart LR
    subgraph Frontend_Layer ["Next.js Frontend Layer"]
        TaskTable["TaskTable Client Component"]
        ToggleAction["toggleTaskCompletion()"]
        CreateAction["createTask()"]
        EditAction["updateTask()"]
        DeleteAction["deleteTask()"]
    end

    subgraph Task_Endpoints ["Task Microservice REST Endpoints"]
        GET_Tasks["GET /api/tasks"]
        POST_Tasks["POST /api/tasks"]
        PUT_Task["PUT /api/tasks/{id}"]
        PATCH_Status["PATCH /api/tasks/{id}/status"]
        DELETE_Task["DELETE /api/tasks/{id}"]
    end

    TaskTable -->|"Initial Load (Server Component)"| GET_Tasks
    CreateAction -->|"ADMIN / MANAGER"| POST_Tasks
    EditAction -->|"ADMIN / MANAGER"| PUT_Task
    ToggleAction -->|"ADMIN / MANAGER / Task Assignee"| PATCH_Status
    DeleteAction -->|"ADMIN / MANAGER"| DELETE_Task
```

#### Endpoint Definitions

| Endpoint                 | Method   | Required Role                  | Payload / Constraints                      | Description                                  |
| ------------------------ | -------- | ------------------------------ | ------------------------------------------ | -------------------------------------------- |
| `/api/tasks`             | `GET`    | `ADMIN`, `MANAGER`, `USER`     | None                                       | Retrieves task list accessible to user role. |
| `/api/tasks`             | `POST`   | `ADMIN`, `MANAGER`             | `{ title, description, priority, userId }` | Creates task assigned to a `USER` account.   |
| `/api/tasks/{id}`        | `PUT`    | `ADMIN`, `MANAGER`             | `{ title, description, priority, userId }` | Updates task metadata or reassignment.       |
| `/api/tasks/{id}/status` | `PATCH`  | `ADMIN`, `MANAGER`, Task Owner | `{ completed: boolean }`                   | Toggles completion status.                   |
| `/api/tasks/{id}`        | `DELETE` | `ADMIN`, `MANAGER`             | None                                       | Removes a task record.                       |

---

### 4.2 User Microservice (`USER_SERVICE_URL`)

```mermaid
flowchart LR
    subgraph Frontend_Layer ["Next.js Frontend Layer"]
        PageLoad["Tasks & Users Server Components"]
        UserActions["lib/actions/users.ts"]
    end

    subgraph User_Endpoints ["User Microservice REST Endpoints"]
        GET_Users["GET /api/users"]
        POST_Users["POST /api/users"]
        PUT_Users["PUT /api/users/{id}"]
        DELETE_Users["DELETE /api/users/{id}"]
    end

    PageLoad -->|"Fetch Assignees / User Directory"| GET_Users
    UserActions -->|"Create Account (ADMIN Only)"| POST_Users
    UserActions -->|"Update Account (ADMIN Only)"| PUT_Users
    UserActions -->|"Delete Account (ADMIN Only)"| DELETE_Users
```

#### Endpoint Definitions

| Endpoint          | Method   | Required Role      | Payload / Constraints                                                                                     | Description                                     |
| ----------------- | -------- | ------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `/api/users`      | `GET`    | `ADMIN`, `MANAGER` | None                                                                                                      | Fetches directory of system user accounts.      |
| `/api/users`      | `POST`   | `ADMIN`            | `name` (2-50 chars), `username` (`[a-z0-9]+`), `password` (8-72 chars), `role` (`ADMIN`/`MANAGER`/`USER`) | Registers a new user account.                   |
| `/api/users/{id}` | `PUT`    | `ADMIN`            | Same constraints as `POST` endpoint                                                                       | Modifies existing user account details or role. |
| `/api/users/{id}` | `DELETE` | `ADMIN`            | Path variable `{id}`                                                                                      | Removes a system user account.                  |

---

## 5. Client Data Processing Pipeline

Tasks and user dropdowns undergo in-memory filtering and sorting prior to rendering:

```mermaid
graph TB
    subgraph Ingestion ["Data Ingestion"]
        RSC["Server Component Fetch"] -->|"initialTasks & users"| TaskTable["TaskTable Component State"]
    end

    subgraph Pipeline ["Data Processing Pipeline"]
        TaskTable --> Filter_Search["1) Search Filter: Title & Description"]
        Filter_Search --> Filter_Priority["2) Priority Filter: LOW / MEDIUM / HIGH"]
        Filter_Priority --> Filter_Assignee["3) Assignee Filter: User ID"]
        Filter_Assignee --> Sort_Title["4) Title Sort: localeCompare Alphabetical"]
    end

    subgraph Render ["UI Render"]
        Sort_Title --> DOM["Rendered Data Table"]
    end

```

---

## 6. Role-Based Access Control (RBAC)

The application enforces strict RBAC across UI components, Server Actions, and backend API endpoints for both Task Management and User Management.

### Task Management RBAC

| Action / Feature               |  `ADMIN`  | `MANAGER` |     `USER`     |
| :----------------------------- | :-------: | :-------: | :------------: |
| **View Task Registry**         | All Tasks | All Tasks | All / Filtered |
| **Search & Priority Filter**   |    Yes    |    Yes    |      Yes       |
| **Filter by Assignee**         |    Yes    |    Yes    |       No       |
| **Toggle Task Completion**     | Any Task  | Any Task  | Own Tasks Only |
| **Create New Task**            |    Yes    |    Yes    |       No       |
| **Edit Task / Reassign Owner** |    Yes    |    Yes    |       No       |
| **Delete Task**                |    Yes    |    Yes    |       No       |
| **Actions Column Visibility**  |  Visible  |  Visible  |   **Hidden**   |

### User Management RBAC (`/dashboard/users`)

| Action / Feature                               | `ADMIN` |   `MANAGER`   |    `USER`     |
| :--------------------------------------------- | :-----: | :-----------: | :-----------: |
| **Access User Directory (`/dashboard/users`)** | Allowed | Access Denied | Access Denied |
| **View System User List**                      |   Yes   |      No       |      No       |
| **Search User Accounts**                       |   Yes   |      No       |      No       |
| **Create New User**                            |   Yes   |      No       |      No       |
| **Edit User Account / Role**                   |   Yes   |      No       |      No       |
| **Delete User Account**                        |   Yes   |      No       |      No       |

---

## 7. CI/CD Pipeline Architecture

The application uses a 3-stage GitHub Actions workflow (`.github/workflows/ci.yml`) that automates code verification, semantic versioning, and container image publishing. The Publish stage runs only when the Semantic Release stage publishes a new version; if no releasable commits are found, the pipeline ends after Stage 2.

```mermaid
graph TD
    subgraph Stage1 ["Stage 1: Test & Build"]
        A["Git Push to main"] --> B["1) Lint, Test & Build Check"]
    end

    subgraph Stage2 ["Stage 2: Semantic Release"]
        B -->|"Success"| C["2) Analyze Commits & Calculate Next Version"]
        C --> Q{"New version released?"}
        Q -->|"Yes"| D["Generate Git Tag & GitHub Release Notes"]
        Q -->|"No"| X["Skip Publish"]
    end

    subgraph Stage3 ["Stage 3: Publish"]
        D -->|"Success"| E["3) Build Docker Image"]
        E --> F["Push to Docker Hub<br/>:latest, :sha, :version, :tag"]
    end
```

Refer to the deployment workflow [here](deployment.md) for details.

> **Deployment**: The application is deployed on Vercel, which is handled separately and is not part of this workflow. The former Railway deployment job (Stage 4) has been disabled in `ci.yml` due to a security incident.

## 8. Tech Stack

- **Frontend Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React Server Components, Server Actions)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Language**: TypeScript
- **Backend Ecosystem**: Spring Boot Java Microservices (Task Service & User Service)
- **Authentication**: RS256-signed JWTs (Asymmetric Public/Private Key verification with session claims parsing)

---

## 9. Project Architecture & Directory Structure

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

---

## 10. Getting Started

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

## 11. Form Validation Standards

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
