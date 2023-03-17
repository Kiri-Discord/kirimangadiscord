const { SlashCommandBuilder } = require('discord.js');


exports.run = async(client, interaction) => {

}

exports.info = {
    name: 'search',
    slash: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for manga on MangaDex. Additional inclusion/exclusion tags can be applied.')
}