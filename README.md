# TaskFlow – Task Management System

**TaskFlow** is a full-stack web application designed to help users efficiently manage projects and tasks.  
It provides a structured workflow for tracking tasks across different stages and offers a clear overview through a dashboard.  

Each project contains tasks aimed at achieving specific goals, and tasks are tracked using statuses: **To Do**, **In Progress**, **Done**.

---

## Features

### Dashboard
- Overview of total projects and tasks
- Visual summary of:
  - To Do tasks
  - In Progress tasks
  - Done tasks
- Quick understanding of overall progress

### Projects Management
- CRUD operations for projects (Create, Read, Update, Delete)
- Display project details: name, description, number of tasks
- Navigate to project tasks

### Task Management (Kanban Board)
- Tasks organized in three columns: To Do, In Progress, Done
- Add, edit, delete tasks
- Assign tasks to users, set priority, and deadlines
- Drag-and-drop functionality updates task status
- Backend sync for all task changes

### Profile Management
- View and edit personal information (name, email)

### Authentication
- Register new users
- Login existing users
- JWT-based secure authentication
- Protected routes for authorized users

### Optional Features
- Search and filter projects/tasks by status
- Dynamic result display

---

##  Technology Stack

- **Frontend:** Angular + Kendo UI  
- **Backend:** Spring Boot + Spring Security (JWT)  
- **Database:** PostgreSQL  
- **Tools:** Postman, Git, GitHub (Feature Branching, Pull Requests, Code Reviews)  

---

##  System Behavior

1. User logs in → Dashboard displays overview  
2. Navigate to Projects Page → List of projects  
3. Select a project → Tasks displayed in Kanban board  
4. Manage tasks (CRUD, drag-and-drop, assignment, priority, deadlines)  
5. Update profile if needed  
6. Task progress percentage = Completed tasks ÷ Total tasks  

---

##  Development Approach

- **Feature-Based Collaborative Development:** Each feature includes backend, frontend, integration, and testing  
- **Integrated Testing:**  
  - Frontend: Jest (unit & integration tests)  
  - Backend: Spring Boot Test (unit & integration tests)  
  - End-to-End Testing: Full feature testing across UI, API, and database  
- **Work Distribution:**  
  - Team Members: Ali Hayek, Suhaila Issa  
  - Each feature has a primary developer + reviewer  
  - Roles rotate for shared experience  
- **Code Reviews:** Primary developer + reviewer per feature  

---



## Success Criteria

- Full CRUD for projects and tasks  
- Kanban task board with drag-and-drop functionality  
- Task assignment, deadlines, and progress tracking  
- Secure authentication and profile management  
- Tested, bug-free, visually organized UI  
- Effective teamwork reflected in code quality  

---

##  Team Members

- **Ali Hayek** – Backend & Task Management  
- **Suhaila Issa** – Frontend & Project Management  

---

##  Deliverables

- Functional web application:
  - Dashboard  
  - Projects Page  
  - Tasks Page  
  - Profile Page  
  - Authentication Pages  
- Clean, structured GitHub codebase  
- Documentation and demo
