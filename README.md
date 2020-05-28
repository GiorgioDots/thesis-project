# User

```yaml
telegramIds:
  Array of Objects:
    name: String, required
    telegramId: String, required
name: String, required
raspberries: Array of References to Raspberry
email: String, required, unique
people: Array of References to Person
events: Array of References to Event
password: String, required, min length 8 characters
collectionId: String, required
createdAt: Date
updatedAt: Date
```

# Raspberry

```yaml
raspiId: String, required, unique
resolution: String, default "1280x720", options ("1920x1080", "1280x720", "640x480")
confidence: Number, default 50, min 1, max 99
isActive: Boolean, default true
name: String, required
wifiSSID: String
wifiPassword: String
raspiPassword: String
lastImages:
  Array of Objects:
    imageUrl: String, required
    imageId: String, required
    timestamp: String, required
userId: ref to User, required
createdAt: Date,
updatedAt: Date
```

# Event

```yaml
person: reference to Person
userId: reference to User, required
description: String, required
imageName: String required
imageUrl: String, required
raspiId: String, required
createdAt: Date,
updatedAt: Date
```

# Person

```yaml
name: String, required
imageUrl: String, required
description: String
userId: reference to User, required
faceId: String ,required
imageId: String, required
counter: Number, default 0
doNotify: Boolean, required
createdAt: Date,
updatedAt: Date
```

# API Documentation

The API details are described in [this link](https://web.postman.co/collections/8053108-ba6bd55d-d16d-4951-bc94-9211ddc38cb6?version=latest&workspace=13e0db06-c512-455f-88e3-65a367cd909e).

# Project presentation

Click [this link](https://drive.google.com/open?id=13OOhCa-MJAkcGi3AeWAmfjFU1vEm2DTlZSez3QXFmuk) to view the project presentation.