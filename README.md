# User

```yaml
_id: ObjectId, Unique
telegramIds: Array of String
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
_id: ObjectId, Unique
raspiId: String, required, unique
resolution: String, default "1280x720", options ("1920x1080", "1280x720", "640x480")
confidence: Number, default 50, min 1, max 99
isActive: Boolean, default true
wifiSSID: String
wifiPassword: String
raspiPassword: String
lastImages: [String]
userId: ref to User, required
createdAt: Date,
updatedAt: Date
```

For `lastImages`, the strings are the object id inside AWS S3, their format is like `UNIQUE_ID.jpg`.

# Event

```yaml
person: reference to Person
userId: reference to User, required
description: String, required
imageName: String required
imageUrl: String, required
raspiId: String, required
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
```
