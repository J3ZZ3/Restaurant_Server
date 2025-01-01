## Reservations

### Create Reservation
- **URL**: `/api/reservations`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  - `restaurantId` (string)
  - `date` (date)
  - `timeSlot` (string)

### Get User Reservations
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
  - `restaurantId` (string)
  - `date` (date)
  - `timeSlot` (string)

### Delete Reservation
- **URL**: `/api/reservations/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`

