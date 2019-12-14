# Default user schema

```
{
  telegramId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  raspiId: {
    type: Array,
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
  password: {
    type: String,
    required: true
  }
}
```
___
# Default people schema

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
  }
}

```
___
# Authentication

## Signup

Method: PUT

endpoint: {{url}}/auth/signup

Request body (require those information):
```
{
	"email": "test@test.com",
	"name": "Giorgio Dodesini",
	"raspiId": "2569ADS6",
	"telegramId": "13541",
	"password": "password"
}
```
Response status 200: 
```
{
  "message": "Success!",
  "userId": "UID for user",
  "token": "Bearer token"
}

```
Response status 422 missing/wrong information:
```
[
  {
    "value": undefined,
    "msg": 'Please enter a valid email.',
    "param": 'email',
    "location": 'body'
  },
  {
    "value": '',
    "msg": 'Invalid value',
    "param": 'password',
    "location": 'body'
  },
  {
    "value": '',
    "msg": 'Invalid value',
    "param": 'telegramId',
    "location": 'body'
  },
  {
    "value": '',
    "msg": 'Invalid value',
    "param": 'raspiId',
    "location": 'body'
  },
  {
    "value": '',
    "msg": 'Invalid value',
    "param": 'name',
    "location": 'body'
  }
]
```
Response status 422 email already used:
```
{
    "message": "Validation failed.",
    "data": [
        {
            "value": "test@test.com",
            "msg": "E-Mail address already exists!",
            "param": "email",
            "location": "body"
        }
    ]
}
```
Response status 500 = General internal error;
___
## Login

method: POST

endpoint: {{url}}/auth/login

Request body (require those information):
```
{
	"email": "test@test.com",
	"password": "password"
}
```
Response status 200:
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJ1c2VySWQiOiI1ZGVkNjU5MmU3N2Q1ZDJhMWMwZTI0MTAiLCJpYXQiOjE1NzU4Mzk2Njh9.mAQcZlOil3T6uvLRVhlCEAh_1yPnT6qCnVmAT7dsYkI",
    "userId": "5ded6592e77d5d2a1c0e2410"
}
```
Response status 401:
```
{
    "message": "A user with this email could not be found."
}
```
or
```
{
    "message": "Wrong password!"
}
```
Response status 500 = General internal error;
___
