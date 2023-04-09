const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js')

exports.run = async(client, interaction) => {
    const embed = new EmbedBuilder()
    .setTitle('Hi, i\'m Mio!')
    .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
    .setColor('#BA8474')
    .setDescription(`
    Hi, i'm Mio! I'm a bot that can help you to search, read and track your manga reading list right on Discord!

    To get started, you can use the \`/manga search\` command to search for a manga, or \`/manga random\` to get a random manga. You can then either save them to your reading list, or read them right away!
    For any further help regarding each feature of the bot, you can use the \`F.A.Q\` button below my response after you execute a command to get more information about that feature.

    If you have any questions, feel free to join my [support server](https://discord.gg/kUWJgBkp) for more help and support!

    Powered by [MangaDex](https://mangadex.org) and [MangaDex API](https://api.mangadex.org)
    `);
    
    return interaction.reply({ embeds: [embed], ephemeral: true })
}



exports.info = {
    name: 'help',
    description: 'Feeling lost? This command will help you getting started!',
    slash: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Feeling lost? This command will help you getting started!')
}