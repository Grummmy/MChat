require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'online',
    description: 'Кто же онлайн?',
    options: [
      {
        name: 'сервер',
        description: 'Сервер, на котором вы хотите узнать онлайн.',
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: 'Сириус',
            value: 'sirius',
          },
          {
            name: 'Вега',
            value: 'vega',
          },
          {
            name: 'Титан',
            value: 'titan',
          },
          {
            name: 'все сервера',
            value: 'all',
          },
        ],
        required: true,
      }
    ],
  },
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