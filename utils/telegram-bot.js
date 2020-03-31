const Telegraf = require('telegraf');

const logger = require('../utils/logger');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.telegram.setWebhook(process.env.HEROKU_URL);

bot.command('/start', msg => {
  msg.reply(`Your id: ${msg.update.message.from.id}`);
});

bot.launch();

exports.bot = bot;

exports.botController = (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
};

exports.sendEvent = (description, imageUrl, telegramId) => {
  logger.info(`Sending notification: ${description} ${imageUrl} ${telegramId}`);
  bot.telegram.sendPhoto(telegramId, imageUrl);
  bot.telegram.sendMessage(telegramId, description);
};
