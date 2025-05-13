# Task Management Web App

A modern, full-stack Task Management Web Application with user authentication and CRUD (Create, Read, Update, Delete) features, built with **React.js**, **Node.js**, and **SQLite**. This app allows users to securely register, log in, and manage their personal tasks in an intuitive and responsive interface.

---

## 🚀 Features

- **User Authentication**  
  Secure registration and login using hashed passwords and JSON Web Tokens (JWT) for stateless authentication.

- **Task CRUD Operations**  
  Create, read, update, and delete tasks with real-time updates and task persistence in a database.

- **Mobile Responsive UI**  
  Beautiful, clean, and user-friendly interface that works seamlessly on both desktop and mobile devices.

- **Stateless Backend API**  
  Backend built with Node.js and Express uses JWT tokens to authenticate users and protect API routes.

- **Data Persistence**  
  SQLite database stores user credentials securely and manages user-specific tasks efficiently.

---

## 📚 Tech Stack

```
|---------------------------------------------------------------------------------------------------------|
| Layer          | Technology               | Role                                                        |
|----------------|--------------------------|-------------------------------------------------------------|
| Frontend       | React.js                 | Interactive UI with components for auth and tasks           |
| Backend        | Node.js with Express     | RESTful API handling authentication and task management     |
| Database       | SQLite                   | Lightweight SQL database for storing users and tasks        |
| Authentication | bcrypt + JWT             | Secure password hashing and token-based user authentication |
| Deployment     | AWS/none                 | Live hosting and continuous deployment                      |
|---------------------------------------------------------------------------------------------------------|
 
 ```
---

## 💡 How It Works: User Authentication Overview

1. Registration  
   Users sign up with a username and password. The password is hashed using `bcrypt` before being saved to the SQLite database for maximum security.

2. Login  
   On login, the backend verifies the username exists and compares the hashed password with the supplied one securely. On success, a JWT token is generated and sent to the client.

3. Token Storage & Usage
   The frontend stores the JWT token in `localStorage` and includes it in the `Authorization` header for subsequent requests to protected API routes.

4. Backend Authentication Middleware  
   Every protected endpoint verifies the JWT token for authenticity and extracts user identity, ensuring users only access their own data.

---

## 🎯 Task Management Features

- Users can create new tasks with a title and optional description.
- Tasks can be updated or deleted individually.
- The task list updates reflect changes instantly by fetching fresh data from the backend.
- Tasks are associated with the authenticated user and remain private.

---
```
root/
│
├── backend/                # Node.js Express backend
│   ├── db.js               # SQLite database initialization and schema
│   ├── server.js           # Express server & API routes
│   ├── package.json        # Backend dependencies & scripts
│
├── frontend/               # React frontend (served as standalone index.html)
│   └── index.html          # Single page React app with inline CSS & JS
│
└── README.md               # Documentation file

```
---


