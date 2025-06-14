require('dotenv').config();

const crypto = require('crypto');
const { Telegraf } = require('telegraf');
const { Client, IntentsBitField, TextChannel } = require("discord.js")
const sqlite3 = require('sqlite3').verbose();
const mineflayer = require('mineflayer');

const args = process.argv.slice(3);
let flags = {
  "--name": "Grummy",
  "--host": "VilgelmRP.ru",
  "--version": "1.16.5",
  "--port": 25565,
  "--brand": "discord.gg/ChJPb5rfse",
  "--db": "users.db",
};
args.forEach(arg => {
  if (flags[arg]) flags[arg] = args[args.indexOf(arg) + 1];
});

const db = new sqlite3.Database(flags["--db"], (err) => {
  if (err) {
    console.error(`Error connecting to database ${flags["--db"]}:`, err.message);
  } else {
    log(`Connected to ${flags["--db"]} database`, "i");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )`);
});

const options = {
  host: flags["--host"],
  port: parseInt(flags["--port"], 10),
  version: flags["--version"],
  viewDistance: "tiny",
  brand: flags["--brand"],
}

let chats = {
  telegram: {
    channel: "-1002601787377",
  },
  discord: {
    channel: "1370610985932558401"
  }
}

const logtypes = {
  "i": "\x1b[36mINFO\x1b[0m",
  "e": "\x1b[31mERROR\x1b[0m",
  "d": "\x1b[33mDEBUG\x1b[0m"
}

function getDate() {
  return new Date().toISOString().replace("T", " - ").slice(0, -1)
}

function log(msg, type, prefix) {
  if (typeof type === undefined) type = ` - ${logtypes['d']}`
  else if (logtypes[type]) type = ` - ${logtypes[type]}`
  else type = ` - ${type}`
  prefix = prefix ? ` - ${prefix}` : ""

  console.log(`${getDate()}${prefix}${type}\n${msg}`)
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
const re = /\u001b\[38;?(\d+;)?(\d+);(\d+);(\d+)m|\u001b\[(\d+;)?(\d+)m/g

const originalWarn = console.warn;
console.warn = function (message) {
  if (message.includes('Ignoring block entities as chunk failed to load')) {return}
  originalWarn.apply(onsole, arguments);
};

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
  if (msg == "") return false
  else return true
}

function colorize(msg) {
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

function getDisplayName(player) {
  let name = player.displayName.json.extra.map(entry => entry.text).join("").split(" ")
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

  return name.join(" ")
}

function sendmsg(text) {
	const ansi = text.includes("\u001b") ? "```ansi\n"+text+"```" : text
  const clean = text.replace(/\u001b\[([0-9]+;?)+m/gi, "")
  if (chats.telegram.channel) tgbot.telegram.sendMessage(chats.telegram.channel, clean)
  if (chats.discord.channel) chats.discord.channel.send(colorize(ansi))
}

function getPlayers(bot) {
  let result = [""]

  for (const player of Object.values(bot.players)) {
    let name = getDisplayName(player)

    if (result[result.length-1].length >= 1990) {
      result.push("\n" + name)
    } else result[result.length-1] += "\n" + name
  }
  
  return result
}

let unverified = {}
let bot
function createBot(options) {
  bot = mineflayer.createBot(options);
  let messages = []
  let ECONNREFUSE = 0
  
  bot.on('spawn', () => {
    log(`Entered the server!`, "i", options.username);
    sendmsg("### Зашел на сервер!")
  });

  bot.on('end', () => {
    const sec = 7
    log(`Session ended, reconnecting in ${sec} seconds!`, "\x1b[33mEND\x1b[0m", options.username);
    sendmsg(`### Уух... что-то поплохело мне, отключаюсь. Постараюсь подключится через ${sec}сек`)
    if (ECONNREFUSE >= 3) {
      sendmsg("### Из-за множественного отключения по ECONNREFUSE, переподключусь через 5 минут.")
      setTimeout(() => createBot(options), 300000);
      ECONNREFUSE = 0
    } else setTimeout(() => createBot(options), sec*1000);
  });

  bot.on('kicked', (reason, loggedIn) => {
    loggedIn = loggedIn ? "\x1b[32mlogged in\x1b[0m" : "\x1b[31mnot logged in\x1b[0m"
    log(`Bot kicked :(\n${reason}`, "\x1b[31mERROR\x1b[0m - ${loggedIn}", options.username);
    sendmsg("### Вот гады, кикнули меня!")
    tgbot.telegram.sendMessage("5645707560", `Меня кикнули\!\! \:\_(\n\`\`\`json\n${reason}\n\`\`\``, { parse_mode: 'MarkdownV2' })
  });

  bot.on('error', err => {
    console.error(`${getDate()} - ${options.username} - \x1b[31mERROR\x1b[0m\n${err}`);
    if (err.code == "ECONNRESET") sendmsg("### Блэн, соединение порвалось.. отрастет ли новое?")
    else if (err.code == "ECONNREFUSE") {
      sendmsg("### Похоже сервер упал, либо меня в фаерволе заблокали..")
      ECONNREFUSE++

      const current = ECONNREFUSE
      setTimeout(() => {
        if (current === ECONNREFUSE) {
          ECONNREFUSE = 0
        }
      }, 60000);
    }
    else sendmsg(`### Ужас, ${err.code} какой-то вылез и не хочет убираться.\n\`\`\`${err}\`\`\``)
    tgbot.telegram.sendMessage("5645707560", err)
  });

  bot.on("message", async (message) => {
    const mes = message.toAnsi().trim().replaceAll("`", "​`")
    if (message.toString().trim() === "Авторизация: /login <Пароль>") bot.chat("/login qazwsxdf12")
    if (checkmsg(message.toString().trim())) messages.push(mes
    	// .replace("ᰁ", "G")
    	// .replace("ᰀ", "L")
    	.replaceAll("§x", "")
    )

    // match[1] -> nickname ; match[2] -> code ; match[3] -> message, if not a /link message
    const match = message.toString().match(/\[(?:\[.*\])? ([a-z0-9_]*) ?(?:\[.*\])? -> Я\] (?:\/link ([0-9a-z]{6,})|(.*))/i)
    // (?:\/link ([0-9a-z]{6,})|(.*))
    if (match) {
      if (match[2]) {
        if (match[1].toLowerCase() in unverified) {
          const user = unverified[match[1].toLowerCase()]
          delete unverified[match[1].toLowerCase()]

          if (Date.now() - user.time >= 120000 && !unverified[match[1].toLowerCase()].code === match[2].toLowerCase()) {
            bot.chat(`/msg ${match[1]} к сожалению, ваш код более не валиден, либо истекло время кода, либо код неверный. пожалуйста, получите новый код и попробуйте ещё раз`)
            return
          }
          
          db.run("INSERT INTO users (id, name) VALUES (?, ?)", [user.id, match[1]], function(err) {
            if (err) {
              return console.error(err.message);
            }
            log(`[+] User \x1b[1${match[1]}\x1b[0m with id \x1b[1m${user.id}\x1b[0m`, 'i', options.username);
          });

          try {
            const u = await dcbot.users.fetch(user.id)
            await u.send(`Никнейм ${match[1]} успешно привязан к вашему дискорду!`)
            await u.send("Теперь вы можете писать в майнкрафт прямо из **CMC Chats**")
          } catch (error) {
            log(`Error while messaging ${user.id}:\n${error}`, 'e', options.username)
          }

          bot.chat(`/msg ${match[1]} вы успешно привязали аккаунт ${match[1]} к ${user.username}! идите скорее и напишите же свое первое сообщение от лица бота)`)
        } else bot.chat(`/msg ${match[1]} вы не регестрировались!`)
      } else if (match[3]) bot.chat(`/msg ${match[1]} привет! я не игрок, а бот, но я хороший! я переношу все сообщения из майнкрафт чата в тгк(@vilgelm_mchat) и дс(discord.gg/ChJPb5rfse). прошу к подписке! (бруно и навазета в курсе о существовании данного проетка)`)
    }
  });

  setInterval(() => {
    if (messages.length > 0) {
      sendmsg(messages.join("\n"));
      messages = [];
    }
  }, 1000);
}

dcbot.login(process.env.DISCORD_BOT_TOKEN)
dcbot.once('ready', async () => {
  log("Social bots started!", "i")

  chats.discord.channel = await dcbot.channels.fetch(chats.discord.channel)
  if (chats.discord.channel instanceof TextChannel) createBot({...options, username: flags["--name"]})
})

dcbot.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'online') {
    let server = interaction.options.get('сервер').value.toLowerCase()
    server = server[0].toUpperCase() + server.slice(1)
    if (!Object.keys(bots).includes(server)) {
      interaction.reply("Сервера `"+server+"` не существует!")
      return
    }
    const online = getPlayers(bots[server])

    await interaction.reply(`Онлайн ${server}:\n\`\`\`ansi${online[0]}\`\`\``);
    for (const list of online.slice(1)) {
      await interaction.followUp(`\`\`\`ansi${list}\`\`\``)
    }
  } else if (interaction.commandName === "verify") {
    const nickname = interaction.options.get('ник').value.toLowerCase()
    if (!/^[a-z0-9_]*$/.test(nickname) && nickname.length <= 16 && nickname.length >= 3) {
      return interaction.reply({
        content: "Некорректный никнейм, пожалуйста попробуйте ещё раз",
        ephemeral: true
      })
    }
    const code = crypto.randomBytes(3).toString('hex');
    unverified[nickname] = {
      code: code,
      id: interaction.user.id,
      username: interaction.user.username,
      time: Date.now()
    }
    return interaction.reply({
      content: `Почти готово! Зайдите на CountryMC, на любой сервер и напишите в лс боту с названием сервера \`/link ${code}\`\nПример для Титана: \`/msg Titan /link ${code}\``,
      ephemeral: true
    })
  }
});
