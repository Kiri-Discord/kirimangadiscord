const {
    SlashCommandSubcommandBuilder
} = require("discord.js");
const readingSessionDatabase = require("../../database/readingSessions");

exports.run = async(client, interaction) => {
    const id = interaction.options.getString('id');
    if (!id) return interaction.reply({
        content: "A session ID is required to modify a session. You can get the session ID by using `/session list`, or click on the `Copy session ID` button below your reading session!",
        ephemeral: true,
    });

    await interaction.deferReply({ ephemeral : true });

    const session = await readingSessionDatabase.findOne({
        sessionId: id,
        userId: interaction.user.id,
    });
    if (!session) return interaction.editReply({ content: "It looks like that this session ID that you provided isn't avaliable, or it doesn't belong to you <:Sapo:1078667608196391034>", ephemeral : true });

    const allow = interaction.options.getBoolean('allow');
    if (allow === session.share) return interaction.editReply({ content: `That session has already been ${allow ? 'shared' : 'private'}!`, ephemeral : true });
    else {
        session.lastUpdated = Date.now();
        session.share = allow;
        await session.save();
    }
    return interaction.editReply({ content: `${allow ? 'Turned on' : 'Turned off'} sharing for session **${session.mangaName}** (\`${session.sessionId}\`)!` });
}

exports.info = {
    name: 'share',
    slash: new SlashCommandSubcommandBuilder()
    .setName('share')
    .setDescription('Allow others to interact with one of your reading session')
    .addStringOption(option => option.setName('id').setDescription('ID of the session that you want to share').setRequired(true))
    .addBooleanOption(option => option.setName('allow').setDescription('Whether or not to allow others to interact with your reading session').setRequired(true))
}