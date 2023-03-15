const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const wordsFrequency = require('words-frequency');
const WordCloud = require('node-wordcloud')();
const stopWords = require('../assets/stopWords.json')

const { createCanvas } = require('canvas');

exports.run = async(client, interaction) => {
    await interaction.deferReply();
    const clientMember = await interaction.guild.members.fetchMe();
    const { channel } = interaction;
    if (!channel.viewable || !channel.permissionsFor(clientMember).has(PermissionsBitField.Flags.ReadMessageHistory)) return interaction.editReply({
        content: `:x: I don't have the \`READ_MESSAGE_HISTORY\` permission to read messages in ${channel.toString()}...`,
    });

    const messages = await channel.messages.fetch({ limit: 100 });
    if (!messages.size) return interaction.editReply({
        content: "There are no message in this channel!"
    });

    const includeStop = interaction.options.getBoolean('include-stopword');


    const string = [...messages.values()].map(msg => msg.content).join(" ");

    const cleanString = string.split(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu).join('').split(/<(?:@[!&]?|#)\d+>/g).join('')


    const frequentList = Object.entries(wordsFrequency(cleanString).data);
    const filtered = includeStop ? frequentList : frequentList.filter(a => !stopWords.includes(a[0]))
    const sorted = filtered.sort((a, b) => b[1] - a[1])


    const canvas = createCanvas(500, 500);
    const wordcloud = WordCloud(canvas, { list: sorted });
    wordcloud.draw();

    const buffer = canvas.toBuffer();

    return interaction.editReply({ files: [{ attachment: buffer, name: 'stopword.png' }] });
};

exports.info = {
    name: 'wordcloud',
    description: 'Generate a wordcloud base on recent messages in the current channel',
    slash: new SlashCommandBuilder()
    .setName('wordcloud')
    .setDescription('Generate a wordcloud base on recent messages in the current channel')
    .addBooleanOption(option => option
        .setName('include-stopword')
        .setDescription('Whether to includes stopword (to, with, a, the,....) in the wordcloud image')
        .setRequired(false)
    )
}