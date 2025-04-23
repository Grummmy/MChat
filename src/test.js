require('dotenv').config();
const fs = require('fs');
const { Telegraf } = require('telegraf');
const { Client, IntentsBitField, TextChannel, escapeMarkdown } = require("discord.js")
const mineflayer = require('mineflayer');

const args = process.argv.slice(3);
let flags = {
  "--servers": "nickname",
  "--name": "nickname",
  "--host": "play.countrymc.net",
  "--version": "1.16.5",
  "--port": 25565,
  "--brand": "TelegramChannel",
};
args.forEach(arg => {
  if (flags[arg]) flags[arg] = args[args.indexOf(arg) + 1];
});

const options = {
  host: flags["--host"],
  port: parseInt(flags["--port"], 10),
  version: flags["--version"],
  viewDistance: "tiny",
  brand: flags["--brand"],
}

let chats = {
  "nickname": {
    tgchat: [""],
    tgchannel: "",
    discord: "1362652056904798208"
  },
}

const prefixes = {
  "ɪɴᴛᴇʀɴ": "\x1b[36m",
  "ᴊʀ.ʜᴇʟᴘᴇʀ": "\x1b[32m",
  "ʜᴇʟᴘᴇʀ": "\x1b[32m",
  "ᴊʀ.ᴍᴏᴅᴇʀ": "\x1b[34m",
  "ᴍᴏᴅᴇʀ": "\x1b[34m",
  "ᴊʀ.ᴘʀᴏᴅᴜᴄᴇʀ": "\x1b[35m",
  "ᴘʀᴏᴅᴜᴄᴇʀ": "\x1b[35m",
  "ʏᴏᴜᴛᴜʙᴇʀ": "\x1b[31m",
  "ᴀᴜᴅɪᴛᴏʀ": "\x1b[36m",
  "ᴋᴜʀᴀᴛᴏʀ": "\x1b[31m",
  "ᴀᴅᴍɪɴ": "\x1b[31m",
}

const prefixes2 = {
  "ᴛᴇᴀᴍ": "\x1b[33m",
  "ᴍᴇᴅɪᴀ": "\x1b[35m",
}

function getDate() {
  return new Date().toISOString().replace("T", " - ").slice(0, -1)
}

const tgbot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
const dcbot = new Client({
  intents: [
    IntentsBitField.Flags.GuildMessages
  ]
})
const colors = {
  "30": [0, 0, 0],
  "31": [201, 49, 49],
  "32": [13, 188, 121],
  "33": [229, 229, 16],
  "34": [36, 114, 200],
  "35": [188, 63, 188],
  "36": [17, 168, 205],
  "37": [255, 255, 255]
};
const re = /\\u001b\[38;?(\d+;)?(\d+);(\d+);(\d+)m|\\u001b\[(\d+;)?(\d+)m/g

const originalWarn = console.warn;
console.warn = function (message) {
  if (message.includes('Ignoring block entities as chunk failed to load')) {return}
  originalWarn.apply(console, arguments);
};

function isTownLetter(str) {
  return /^[а-яА-ЯёЁ]+$/.test(str);
}

function isUsernameLetter(str) {
  return /^[a-zA-Z_]+$/.test(str);
}

function hexToRGB(hex) {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length !== 6) throw new Error("Invalid hex color format");

  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

function getcolor(r, g, b) {
  let smallest = ["37", Infinity];
  for (const [key, value] of Object.entries(colors)) {
    const n = Math.sqrt((r - value[0]) ** 2 + (g - value[1]) ** 2 + (b - value[2]) ** 2);
    if (n < smallest[1]) smallest = [key, n];
  }

  return smallest[0];
}

function checkmsg(msg) {
  if (msg == "" ||
    msg.startsWith("☑") ||
    msg.startsWith("➜ Сайт:") ||
    msg.startsWith("➜ Вконтакте:") ||
    msg.startsWith("➜ Гайды:") ||
    msg.startsWith("➜ Дискорд:") ||
    msg == "Сессия сохранена, ввод пароля не требуется" ||
    msg == "You are already connected to this server!"
  ) return false
  return true
}

function changeColors(msg) {
  return msg.replaceAll(re,
    (match, mode1, r, g, b, mode2, base) => {
      // console.log(mode1, r, g, b, mode2, base)
      if (r && g && b) return `\x1b[${mode1 || ""}${getcolor(+r, +g, +b)}m`

      base = parseInt(base, 10)
      if (typeof base === "number") {
        if (30 <= base && base <= 37 || 0 <= base && base <= 4) return `\x1b[${mode2 || ""}${base}m`
        else if (90 <= base && base <= 97) return `\x1b[${mode2 || ""}${base-60}m`
      }

      return ""
    }
  )
}

function sendmsg(text, name, ansi) {
  if (chats[name].tgchat[0]) tgbot.telegram.sendMessage(chats[name].tgchat[0], text, {message_thread_id: chats[name].tgchat[1]})
  if (chats[name].tgchannel) tgbot.telegram.sendMessage(chats[name].tgchannel, text)
  if (chats[name].discord) {
    if (ansi) chats[name].discord.send(changeColors(ansi))
    else chats[name].discord.send(escapeMarkdown(text))
  }
}

function getPlayers(bot) {
  let result = [""]

  for (const players of Object.values(bot.players)) {
    let name = players.displayName.json.extra.map(pl => pl.text).join("").split(" ")
    let prefix = 0

    if (prefixes[name[0]]) {
      name[0] = prefixes[name[0]] + name[0]
      prefix = 1
    } else if (prefixes2[name[0]]) {
      name[0] = prefixes2[name[0]] + name[0]
      prefix = 2
    }

    name[prefix] = "\x1b[0m" + name[prefix]
    name[prefix+1] = "\x1b[33m" + name[prefix+1]

    if (result[result.length-1].length >= 1990) {
      result.push("\n" + name.join(" "))
    } else result[result.length-1] += "\n" + name.join(" ")
  }
  
  return result
}

function createBot(options) {
  const bot = mineflayer.createBot(options);
  let messages = []

  bot.on('spawn', () => {
    console.log(`${getDate()} - ${options.username} - \x1b[36mINFO\x1b[0m\nEntered the server!`);
    setTimeout(() => {bot.chat(`/joinq vega`)}, 3000)
  });

  bot.on('end', () => {
    console.log(`${getDate()} - ${options.username} - \x1b[33mEND\x1b[0m\n Session ended, reconnecting in 5 seconds!`);
    sendmsg("## Уух... что-то поплохело мне. Сессия закончилась, но щас переподключусь!", options.username)
    setTimeout(() => createBot(options), 3000);
  });

  bot.on('kicked', (reason, loggedIn) => {
    loggedIn = loggedIn ? "\x1b[32mlogged in\x1b[0m" : "\x1b[31mnot logged in\x1b[0m"
    console.log(`${getDate()} - ${options.username} - \x1b[31mERROR\x1b[0m - ${loggedIn}\nBot kicked :(`, reason);
    sendmsg("## Блэн, меня кикнули. Переподключусь через 5сек.", options.username)
  });

  bot.on('error', err => {
    console.error(`${getDate()} - ${options.username} - \x1b[31mERROR\x1b[0m\n${err}`);
    if (err.code == "ECONNRESET") sendmsg("## Блэн, соединение порвалось.. отрастет ли новое?", options.username)
    else sendmsg("## Ай, как больно! Эрроры это совсем не круто...", options.username)
    setTimeout(process.exit(err.code), 1000)
  });

  bot.on("message", (message) => {
    const mes = message.toString().trim()

    if (checkmsg(mes)) {
      messages.push(
        [
          mes.replace("ᰁ", "G").replace("ᰀ", "L"),
          message.toAnsi().trim().replace("ᰁ", "G").replace("ᰀ", "L")
        ]
      )
    }

    if (mes[0] == "[") {
      const match = mes.match(/\[([a-zA-Z0-9_]*) -> Я]/i)
      if (match && match.length >= 2) bot.chat(`/msg ${match[1]} привет! я не игрок, а бот, я переношу все сообщения из глобал чата(сириуса, веги и даже титана!) в дс discord.gg/w5HJpE7vGB (код приглашения: w5HJpE7vGB). спешу сообщить что я никак не обхожу систему антибота, или как либо ломаю севрер`)
    }
  });

  setInterval(() => {
    if (messages.length > 0) {
      sendmsg(messages.map(m => m[0]).join('\n'), options.username, "```ansi\n"+messages.map(m => JSON.stringify(m[1]).slice(1, -1)).join('\n')+"```");
      messages = [];
    }
  }, 1000);

  return bot
}

let bots = {}
dcbot.login(process.env.DISCORD_BOT_TOKEN)
dcbot.once('ready', async () => {
  console.log(`${getDate()} - \x1b[36mINFO\x1b[0m\nSocial bots started!`)

  chats["nickname"].discord = await dcbot.channels.fetch(chats["nickname"].discord)

  if (chats["nickname"].discord instanceof TextChannel) {
    const opts = {...options, username: "nickname"}
    bots["nickname"] = createBot(opts)
  }
})

dcbot.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'online') {
    const server = interaction.options.get('сервер').value;
    const online = getPlayers(bots["nickname"])

    await interaction.reply(`\`\`\`ansi${online[0]}\`\`\``);
    for (const list of online.slice(1)) {
      await interaction.followUp(`\`\`\`ansi${list}\`\`\``)
    }
  }
});