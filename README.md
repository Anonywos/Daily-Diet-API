# 🔌 Daily Diet API

This project is part of the Node.js challenge from the Rocketseat platform. The goal is to build a REST API for a daily diet application, allowing users to register meals and track their diet progress. The API was built with Node.js, Fastify, TypeScript, SQLite, Knex, and Zod

The project uses SQLite as the database, with Knex for migrations and database queries. It also includes automated tests written with Vitest and Supertest. Authentication is handled using cookies for study purposes only, since the main goal of this project is to practice the basic concepts of Node.js with Fastify.

## 🚀 Technologies

- Node.js
- TypeScript
- Fastify
- SQLite
- Zod
- Knex
- Dotenv
- Vitest
- Supertest

## 🎯 Features

- Create user
- Create meal
- User authentication with cookies
- List user's meals
- Get a specific meal by ID
- Update an existing meal by ID
- Delete an existing meal by ID
- Get a user summary

## 📚 What I learned

- Building REST APIs with Node.js, Fastify, and TypeScript
- Creating routes and handling HTTP responses
- Validating request data with Zod
- Persisting data with SQLite and Knex
- Managing database migrations with Knex
- Using cookies to identify authenticated users
- Writing automated tests with Vitest and Supertest
- Organizing a backend project with routes, middlewares, helpers, and database configuration

## 📌 API Routes

###  Create user

POST /users

Example body:

{
  "name": "John Doe",
  "email": "johndoe@email.com",
  "password": "123456"
}

### Create meal

POST /meals

Example body:

{
  "name": "Lunch",
  "description": "Rice, beans and chicken",
  "in_diet": true,
  "date": "2026-06-09T12:00:00.000Z"
}

### List user's meals

GET /meals

### Get a specific meal

GET /meals/:id

### Update a meal

PUT /meals/:id

Example body:

{
  "name": "Dinner",
  "description": "Salad and grilled chicken",
  "in_diet": true,
  "date": "2026-06-09T19:00:00.000Z"
}

### Delete a meal

DELETE /meals/:id

### Get user's meal summary

GET /meals/summary

## ⚙️ How to run

```bash
git clone https://github.com/Anonywos/Daily-Diet-API.git
cd Daily-Diet-API
npm install
npm run knex -- migrate:latest
npm run dev
```

## 🧪 How to run tests

```bash
npm run test
```
