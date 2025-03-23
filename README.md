# IMF Gadget API

## Overview
A secure REST API for the Impossible Missions Force (IMF) to manage their high-tech gadgets. This API provides endpoints for gadget inventory management with features like self-destruct sequences and mission success probability calculations.

## Live Demo
API Documentation: [https://imf-gadget-api-dhbc.onrender.com/api-docs](https://imf-gadget-api-dhbc.onrender.com/api-docs)

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- bcrypt for password hashing
- Swagger for API documentation

## Features
- 🔐 Secure JWT Authentication
- 🎯 Dynamic Mission Success Probability
- 🔄 Automatic Codename Generation
- 💥 Self-Destruct Mechanism
- 📊 Status Tracking System
- 🔍 Filterable Gadget Search
- 📚 Swagger Documentation

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm/yarn

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/VamsiKrishnaThota03/imf-gadget-api.git
   cd imf-gadget-api
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```bash
   PORT=3000
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/imf_gadgets
   JWT_SECRET=your_secret_key
   ```
4. **Database Setup**
   - Create PostgreSQL database named 'imf_gadgets'
   - Tables will be auto-created on server start

5. **Start the Server**
   - Development mode:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## API Documentation

### Authentication

#### Register New Agent
   ```http
   POST /api/auth/register
   Content-Type: application/json
   {
     "username": "agent007",
     "password": "secret123"
   }
   ```
   **Response:**
   ```json
   {
     "user": {
       "id": "uuid",
       "username": "agent007"
     },
     "token": "jwt.token.here"
   }
   ```

#### Agent Login
   ```http
   POST /api/auth/login
   Content-Type: application/json
   {
     "username": "agent007",
     "password": "secret123"
   }
   ```

### Gadget Operations

All gadget endpoints require authentication header:
   ```http
   Authorization: Bearer your.jwt.token
   ```

#### List All Gadgets
   ```http
   GET /api/gadgets
   ```

#### Filter Gadgets by Status
   ```http
   GET /api/gadgets?status=Available
   ```
   **Status options:**
   - Available: Gadgets ready for deployment
   - Deployed: Currently in active mission use
   - Destroyed: Gadgets that underwent self-destruct
   - Decommissioned: Retired from service

   **Example Responses:**

   **All Gadgets:**
   ```json
   {
     "count": 2,
     "gadgets": [
       {
         "id": "uuid1",
         "name": "Laser Watch",
         "codename": "The Phoenix",
         "status": "Available",
         "missionSuccessProbability": "85%"
       },
       {
         "id": "uuid2",
         "name": "Exploding Pen",
         "codename": "The Dragon",
         "status": "Deployed",
         "missionSuccessProbability": "92%"
       }
     ]
   }
   ```

#### Add New Gadget
   ```http
   POST /api/gadgets
   Content-Type: application/json
   {
     "name": "Laser Watch"
   }
   ```

#### Update Gadget
   ```http
   PATCH /api/gadgets/:id
   Content-Type: application/json
   {
     "status": "Deployed"
   }
   ```

#### Decommission Gadget
   ```http
   DELETE /api/gadgets/:id
   ```

#### Initiate Self-Destruct
   ```http
   POST /api/gadgets/:id/self-destruct
   ```

## Data Models

### Gadget Model
   ```json
   {
     "id": "UUID",
     "name": "String",
     "codename": "String",
     "status": "Enum['Available', 'Deployed', 'Destroyed', 'Decommissioned']",
     "decommissionedAt": "Date",
     "missionSuccessProbability": "Float"
   }
   ```

### User Model
   ```json
   {
     "id": "UUID",
     "username": "String",
     "password": "String (hashed)"
   }
   ```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Secure database operations
- Input validation

## Development
   ```bash
   # Run in development mode with hot reload
   npm run dev
   
   # Run in production mode
   npm start
   ```

## Testing
Use Thunder Client or Postman to test the endpoints:

**Base URLs:**
- Local: `http://localhost:3000`
- Production: `https://imf-gadget-api-dhbc.onrender.com`

## Deployment
The API is deployed on Render. To deploy your own instance:

1. Create a Render account
2. Create a new PostgreSQL database
3. Create a new Web Service
4. Connect your GitHub repository
5. Add environment variables:
   ```bash
   DATABASE_URL=your_render_postgres_url
   NODE_ENV=production
   JWT_SECRET=your_secret
   PORT=3000
   ```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

