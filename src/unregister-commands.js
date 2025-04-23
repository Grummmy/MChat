require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
const name = 'online';

(async () => {
  try {
    console.log('Getting commands...');
    const commands = await rest.get(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
    );

    const command = commands.find(cmd => cmd.name === name);
    if (!command) return console.log(`Command ${name} not found.`);

    await rest.delete(
      Routes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID, command.id)
    );

    console.log(`Command ${name} was deleted.`);
  } catch (error) {
    console.error('Error deleting command:', error);
  }
})();
