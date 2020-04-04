# User

```yaml
_id: ObjectId, Unique
telegramId: Array of String
name: String, required
raspberries: Array of References to Raspberry
email: String, required, unique
people: Array of References to Person
events: Array of References to Event
password: String, required, min length 8 characters
collectionId: String, required
plantStatus: String, options ("offline", "partial", "working"), default "offline"
createdAt: Date
updatedAt: Date
```

For plant status:

- offline: every raspberries are disconnected;
- partial: some raspberries are disconnected;
- online: every raspberries are connected;

# Raspberry

```yaml
_id: ObjectId, Unique
raspiId: String, required, unique
resolution: String, default "1280x720", options ("1920x1080", "1280x720", "640x480")
confidence: Number, default 50, min 1, max 99
isActivated: Boolean, default true
wiFiSSID: String
wifiPassword: String
raspiPassword: String
lastImages: [String]
createdAt: Date,
updatedAt: Date
```
For `lastImages`, the strings are the object id inside AWS S3, their format is like `UNIQUE_ID.jpg`.