const { SlashCommandBuilder } = require('discord.js');


exports.run = async(client, interaction) => {
    return interaction.reply({ content: `• **Invite me to your server:** [here](https://discord.com/api/oauth2/authorize?client_id=1011670700597194802&permissions=536870928&scope=bot%20applications.commands)\n• **Our support server:** [here](https://discord.gg/kUWJgBkp)`, ephemeral: true })
}

exports.info = {
    name: 'inviteme',
    description: 'Want to invite me to your server? Use this command to get my invite link!',
    slash: new SlashCommandBuilder()
    .setName('inviteme')
    .setDescription('Want to invite me to your server? Use this command to get my invite link!')
}