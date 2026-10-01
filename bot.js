const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const { connectDB, ApiKey } = require('./database');

// ===== SECRETS (YAHAN APNI VALUES DAALO) =====
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://countryadmin:Country2025@cluster0.caysqxw.mongodb.net/countrydb?appName=Cluster0';
process.env.BOT_TOKEN = process.env.BOT_TOKEN || '8813849771:AAFZvwlTRN78R7-v02AkwhN-vSFWlR6YTA8';
process.env.ADMIN_ID = process.env.ADMIN_ID || '8137776838';

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

connectDB();

function isAdmin(msg) {
  return String(msg.from.id) === String(process.env.ADMIN_ID);
}

// /start
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, 'You are not authorized.');
  }

  bot.sendMessage(msg.chat.id,
    'Welcome Admin!\n\n' +
    'Available Commands:\n\n' +
    '/key <NAME> - Create a new API key\n' +
    '/revoke <NAME> - Revoke an existing API key\n' +
    '/list - List all API keys\n\n' +
    'Examples:\n' +
    '/key HELLO\n' +
    '/revoke HELLO'
  );
});

// /key HELLO
bot.onText(/\/key(?:\s+(.+))?/, async (msg, match) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, 'You are not authorized.');
  }

  const name = match[1]?.trim().toUpperCase();

  if (!name) {
    return bot.sendMessage(msg.chat.id, 'Usage: /key <NAME>\nExample: /key HELLO');
  }

  try {
    const existing = await ApiKey.findOne({ name });

    if (existing) {
      return bot.sendMessage(msg.chat.id, 'Key "' + name + '" already exists.\nUse /revoke ' + name + ' first.');
    }

    const key = name + '_' + crypto.randomBytes(16).toString('hex');
    await ApiKey.create({ name, key, active: true });

    bot.sendMessage(msg.chat.id,
      '✅ *Key Created Successfully!*\n\n' +
      '📛 Name: `' + name + '`\n' +
      '🔑 Key: `' + key + '`\n\n' +
      'Use this in API header:\n' +
      '`x-api-key: ' + key + '`',
      { parse_mode: 'Markdown' }
    );

  } catch (err) {
    bot.sendMessage(msg.chat.id, 'Error: ' + err.message);
  }
});

// /revoke HELLO
bot.onText(/\/revoke(?:\s+(.+))?/, async (msg, match) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, 'You are not authorized.');
  }

  const name = match[1]?.trim().toUpperCase();

  if (!name) {
    return bot.sendMessage(msg.chat.id, 'Usage: /revoke <NAME>\nExample: /revoke HELLO');
  }

  try {
    const key = await ApiKey.findOne({ name });

    if (!key) {
      return bot.sendMessage(msg.chat.id, 'Key "' + name + '" not found.');
    }

    key.active = false;
    key.revokedAt = new Date();
    await key.save();

    bot.sendMessage(msg.chat.id,
      '🚫 *Key Revoked Successfully!*\n\n' +
      '📛 Name: `' + name + '`\n' +
      '🔑 Key: `' + key.key + '`\n\n' +
      'This key will no longer work.',
      { parse_mode: 'Markdown' }
    );

  } catch (err) {
    bot.sendMessage(msg.chat.id, 'Error: ' + err.message);
  }
});

// /list
bot.onText(/\/list/, async (msg) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, 'You are not authorized.');
  }

  try {
    const keys = await ApiKey.find();

    if (!keys.length) {
      return bot.sendMessage(msg.chat.id, 'No API keys found.');
    }

    const text = keys.map(k =>
      (k.active ? '✅' : '🚫') + ' *' + k.name + '*\n`' + k.key + '`'
    ).join('\n\n');

    bot.sendMessage(msg.chat.id, '*All API Keys:*\n\n' + text, { parse_mode: 'Markdown' });

  } catch (err) {
    bot.sendMessage(msg.chat.id, 'Error: ' + err.message);
  }
});

console.log('Bot is running...');