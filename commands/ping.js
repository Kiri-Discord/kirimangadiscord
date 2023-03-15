const { SlashCommandBuilder } = require('discord.js');

exports.run = async(client, interaction) => {
    const pingMessage = await interaction.reply({ content: `Almost there...`, fetchReply: true });
    const createdTimestamp = pingMessage.createdTimestamp || new Date(pingMessage.timestamp).getTime();
    const ping = createdTimestamp - interaction.createdTimestamp;
    return interaction.editReply(`:ping_pong: Pong! took me \`${ping}ms\` to reply back, and the ping from my location to Discord is \`${Math.round(client.ws.ping)}ms\``);
};

exports.info = {
    name: 'ping',
    description: 'Ping the bot',
    slash: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping the bot')
}