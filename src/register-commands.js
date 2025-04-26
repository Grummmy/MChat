require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'online',
    description: 'Кто же онлайн?',
    options: [
      {
        name: 'сервер',
        description: 'Сервер, на котором вы хотите узнать онлайн',
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: 'Сириус',
            value: 'Sirius',
          },
          {
            name: 'Вега',
            value: 'vega',
          },
          {
            name: 'Титан',
            value: 'Titan',
          },
        ],
        required: true,
      }
    ],
  },
  {
    name: "verify",
    description: "Верефицируйтесь чтобы писать сообщения прямо из дискорда!",
    options: [
      {
        name: 'ник',
        description: 'Ваш никнейм на любом сервере CountryMC',
        type: ApplicationCommandOptionType.String,
        required: true,
      }
    ],
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
