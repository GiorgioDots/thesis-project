const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.telegram.setWebhook(process.env.HEROKU_URL);

bot.command('/start', (msg) => {
    msg.reply(`Your id: ${msg.update.message.from.id}`);
});

bot.launch();
module.exports = bot;