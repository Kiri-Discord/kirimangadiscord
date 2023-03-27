const {
    SlashCommandSubcommandBuilder
} = require("discord.js");
const readingSessionDatabase = require("../../database/readingSessions");

exports.run = async(client, interaction) => {
    const id = interaction.options.getString('id');
    if (!id) return interaction.reply({
        content: "A session ID is required to delete a session. You can get the session ID by using `/session list`, or click on the `Copy session ID` button below your reading session!",
        ephemeral: true,
    });

    await interaction.deferReply({ ephemeral : true });

    const session = await readingSessionDatabase.findOne({
        sessionId: id,
        userId: interaction.user.id,
    });
    if (!session) return interaction.editReply({ content: "It looks like that this session ID that you provided isn't avaliable, or it doesn't belong to you <:Sapo:1078667608196391034>", ephemeral : true });

    await readingSessionDatabase.findOneAndDelete({
        sessionId: id,
        userId: interaction.user.id,
    });

    return interaction.editReply({ content: `Successfully deleted session **${session.mangaName}** (\`${session.sessionId}\`) from your session list ❌` });
}

exports.info = {
    name: 'delete',
    slash: new SlashCommandSubcommandBuilder()
    .setName('delete')
    .setDescription('Delete a reading session from your session list')
    .addStringOption(option => option.setName('id').setDescription('ID of the session that you want to delete').setRequired(true))
}