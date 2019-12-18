const bot = require('../utils/telegram-bot');

module.exports.sendEvent = (description, imageUrl, telegramId) => {
    bot.telegram.sendPhoto(telegramId, imageUrl);
    bot.telegram.sendMessage(telegramId, description);
} 