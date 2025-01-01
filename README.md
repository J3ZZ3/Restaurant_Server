# API Documentation

## Base URL
`http://localhost:5000`

## Authentication

### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Success Response**: 
  ```json
  {
    "message": "User registered successfully",
    "userId": "user_id"
  }
  ```

### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

## Restaurants

### Create Restaurant
- **URL**: `/api/restaurants`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Restaurant Name",
    "cuisine": "Italian",
    "location": "123 Main St",
    "openingHours": "9:00 AM - 10:00 PM"
  }
  ```

### Get All Restaurants
- **URL**: `/api/restaurants`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Get Restaurant by ID
- **URL**: `/api/restaurants/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Update Restaurant
- **URL**: `/api/restaurants/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "cuisine": "Updated Cuisine",
    "location": "Updated Location",
    "openingHours": "Updated Hours"
  }
  ```

### Delete Restaurant
- **URL**: `/api/restaurants/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`

## Reservations

### Create Reservation
- **URL**: `/api/reservations`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "restaurantId": "restaurant_id",
    "date": "2024-03-20",
    "timeSlot": "19:00",
    "numberOfGuests": 2
  }
  ```

### Get User's Reservations
- **URL**: `/api/reservations`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Get Reservation by ID
- **URL**: `/api/reservations/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Update Reservation
- **URL**: `/api/reservations/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "date": "2024-03-21",
    "timeSlot": "20:00",
    "numberOfGuests": 4
  }
  ```

### Delete Reservation
- **URL**: `/api/reservations/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`

## Testing with Postman

### Prerequisites
- Ensure you have Postman installed on your machine.
- Set up your environment variables in Postman:
  - `MONGODB_URI`: Your MongoDB connection string.
  - `JWT_SECRET`: Your JWT secret key.
  - `FIREBASE_DATABASE_URL`: Your Firebase database URL (if applicable).

### API Endpoints

#### Authentication

1. **Register User**
   - **URL**: `/api/auth/register`
   - **Method**: `POST`
   - **Body**:
     ```json
     {
       "name": "Admin User",
       "email": "admin@example.com",
       "password": "password123",
       "role": "admin"
     }
     ```

2. **Login User**
   - **URL**: `/api/auth/login`
   - **Method**: `POST`
   - **Body**:
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```

3. **Get User Profile**
   - **URL**: `/api/auth/me`
   - **Method**: `GET`
   - **Headers**: `Authorization: Bearer <token>`

4. **Update User Profile**
   - **URL**: `/api/auth/me`
   - **Method**: `PUT`
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**:
     ```json
     {
       "name": "Updated Admin User",
       "email": "admin@example.com"
     }
     ```

#### Restaurants

1. **Create Restaurant**
   - **URL**: `/api/restaurants`
   - **Method**: `POST`
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**:
     ```json
     {
       "name": "New Restaurant",
       "location": "123 Main St",
       "cuisine": "Italian",
       "description": "A lovely Italian restaurant.",
       "contact": "123-456-7890",
       "reservationSlots": []
     }
     ```

2. **Get All Restaurants**
   - **URL**: `/api/restaurants`
   - **Method**: `GET`

3. **Get Restaurant by ID**
   - **URL**: `/api/restaurants/:id`
   - **Method**: `GET`

4. **Update Restaurant**
   - **URL**: `/api/restaurants/:id`
   - **Method**: `PUT`
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**:
     ```json
     {
       "name": "Updated Restaurant Name"
     }
     ```

5. **Delete Restaurant**
   - **URL**: `/api/restaurants/:id`
   - **Method**: `DELETE`
   - **Headers**: `Authorization: Bearer <token>`

## Error Handling
All endpoints will return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

