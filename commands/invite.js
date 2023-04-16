const { SlashCommandBuilder } = require('discord.js');


exports.run = async(client, interaction) => {
    return interaction.reply({ content: `• **Invite me to your server:** [here](https://discord.com/api/oauth2/authorize?client_id=1011670700597194802&permissions=536870928&scope=bot%20applications.commands)\n• **Our support server:** [here](https://discord.gg/kUWJgBkp)`, ephemeral: true })
}

exports.info = {
    name: 'invite',
    description: 'Invite link to add me to your server and my support server invite link.',
    slash: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Invite link to add me to your server and my support server invite link.')
}