# Index

- [Schemes](#Schemes)
  
  1. [User Schema](#Default-user-schema);

  2. [Person Schema](#Default-person-schema);

  3. [Event Schema](#Default-event-schema);

- [Authentication](#Authentication)
  1. [Login](#Login);
  
  2. [Signup](#Signup);

- [People handling](#People-handling)
  
  1. [Get People](#Get-user's-people)

  2. [Get Person](#Get-person)

  3. [Create Person](#Create-person)

  4. [Update Person](#Update-person)

  5. [Delete Person](#Delete-person)

- [Users](#Users)

  1. [Update User](#Update-user)

- [Events](#Events)

  1. [Create event](#Create-event)

  2. [Get event](#Get-event)

  3. [Get events](#Get-events)

  4. [Delete event](#Delete-event)
  
  5. [Delete events](#Delete-events)

# Schemes

# Default user schema

```
telegramId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  raspiId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Person'
    }
  ],
  events: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],
  password: {
    type: String,
    required: true
  },
  collectionId: {
    type: String,
    required: true
}
```
___
# Default person schema

```
{
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  faceId: {
    type: String,
    required: true
  },
  imageName: {
    type: String,
    required: true
  },
  doCount: {
    type: Boolean,
    required: true
  },
  counter: {
    type: Number,
    default: 0
  },
  doNotify: {
    type: Boolean,
    required: true
  }
}

```
# Default event schema

```
{
  person: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
}
```

___

# Authentication

# Login

- URL: `{baseUrl}/auth/login`

- Method: `POST`

- Body: 

```
{
	"email": "test@test.com",
	"password": "123456"
}
```

# Signup

- URL: `{baseUrl}/auth/signup`

- Method: `PUT`

- Body example:

```
{
	"email": "test2@test.com",
	"name": "Giorgio Dodesini",
	"raspiId": "2569ADS6",
	"telegramId": "13541",
	"password": "123456"
}
```

___

# People handling

# Get user's people

- URL: `{baseUrl}/people/`

- Method: `GET`

- Headers:

  - Authorization: `Bearer {token}`
  
- Body example:

```
{
	"userId": "5df4fcc03704a811a0b07135"
}
```

# Get person

- URL: `{baseUrl}/people/:personId`

- METHOD: `GET`

- Headers:

  - Authorization: `Bearer {token}`

- Body example:

```
{
	"userId": "5df4fcc03704a811a0b07135"
}
```

# Create person

- URL: `{baseUrl}/people`

- METHOD: `POST`

- Headers:

  - Authorization: `Bearer {token}`

  - Content-Type: application/x-www-form-urlencoded

- Query parameters:

  - name: `person name`

  - degree: `kindship degree of the person`

  - userId: `id of the user who is creating a person`

- Body:

  - type: form-data

    - image: `photo of the person`

# Update person

- URL: `{baseUrl}/people/personId`

- METHOD: `PUT`

- Headers:

  - Authorization: `Bearer {token}`

  - Content-Type: application/x-www-form-urlencoded

- Query parameters:

  - name: `person name`

  - degree: `kindship degree of the person`

  - userId: `id of the user who is updating the person`

- Body:

  - type: form-data

    - image: `photo of the person`

# Delete person

- URL: `{baseUrl}/people/:personId`

- METHOD: `GET`

- Headers:

  - Authorization: `Bearer {token}`

- Query parameters:

  - userId: `id of the user who is deleting a person`

__

# Users

# Update user

- URL: `{baseUrl}/user/:userId`

- METHOD: `PUT`

- Headers:

  - Authorization: `Bearer {token}`

- Body example:
```
{
	"name": "Kebab",
	"telegramId": "1",
	"raspiId": "2"
}
```

# Events

# Create event

- URL: `{baseUrl}/events/raspiId`

- METHOD: `POST`

- Headers:

  - Content-Type: application/x-www-form-urlencoded

- Body:

  - type: form-data

    - image: `photo of the person`

# Get event

- URL: `{baseUrl}/events/:eventId`

- METHOD: `GET`

- Headers:

  - Authorization: `Bearer {token}`

# Get events

- URL: `{baseUrl}/events/user/:userId`

- METHOD: `GET`

- Headers:

  - Authorization: `Bearer {token}`

# Delete event

- URL: `{baseUrl}/events/:eventId`

- METHOD: `DELETE`

- Headers:

  - Authorization: `Bearer {token}`

# Delete events

- URL: `{baseUrl}/events/user/:userId`

- METHOD: `DELETE`

- Headers:

  - Authorization: `Bearer {token}`
