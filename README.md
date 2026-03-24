TaskFlow Project

1. Project Overview
TaskFlow is a full-stack web application designed to help users efficiently manage projects and tasks.
It provides a structured workflow for tracking tasks across different stages while offering a clear overview through a dashboard.
Each project contains: Name, Description ,Tasks (tracked by status: To Do, In Progress, Done)
Users can manage multiple projects, each with its own tasks, deadlines, and assigned users.

3. Technology Stack
Frontend: Angular + Kendo UI
Backend: Spring Boot + Spring Security (JWT)
Database: PostgreSQL
Tools: Postman, Git, GitHub (Feature Branching, Pull Requests, Code Reviews)

5. System Screens & Features
3.1 Dashboard
Provides a high-level overview of the user’s work
Displays total number of:
-Projects
-To Do tasks
-In Progress tasks
-Done tasks
Shows user projects with:
-Project name
-Progress percentage
Expected Output: Quick understanding of overall progress with a visual summary.

3.2 Projects Page
Manage all user projects
Displays:
-Project name
-Description
-Number of tasks
Project operations: Add, Edit, Delete
Navigation: Clicking a project opens its tasks
Expected Output: Full CRUD operations and clear project navigation.

3.3 Tasks Page
Kanban-style board for managing project tasks
Tasks displayed in 3 columns: To Do, In Progress, Done
Task operations: Add, Edit, Delete
Each task includes:
Name, Description, Status, Priority, Assignee, Deadline
Drag-and-drop: Move tasks between columns to update status
Expected Output: Tasks visually organized, easy tracking, status updates synced with backend.
3.4 Profile Page
Manage personal user information
Display and edit:
User name
Email
Expected Output: Users can manage account information.

3.5 Authentication (Login & Register)
Handles user authentication and access control
Features:
Register new user
Login existing user
JWT-based authentication
Expected Output: Secure authentication system with protected routes.
