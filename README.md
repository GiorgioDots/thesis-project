# Backend project (Raspyface - Utility)

This project provides the RESTFUL API for my diploma's project.

## Technologies

- HEROKU (not local obv)
- MongoDB
- Nodejs
- Azure
- Telegram

## Configure

_note:_ __Nodejs required__

Clone this repo, create a __.env__ file and add these environment variables:

- MONGO_USER: Mongo user;

- MONGO_PASSWORD: Mongo password;

- PORT: the server port (note, if you use Heroku don't set it);

- BOT_TOKEN: Telegram's bot token;

- AZURE_FACE_KEY: Your api key for AZURE face API;

- AZURE_ENDPOINT: Your azure endpoint;

Install the dependecies executing `npm install`.

To test locally execute `npm test.`