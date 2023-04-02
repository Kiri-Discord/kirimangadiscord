const readingSessionDatabase = require("../database/readingSessions");

exports.run = async (client, interaction) => {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    await interaction.deferUpdate();

    const session = await readingSessionDatabase.findOne({
        messageId
    });

    if (!session)
        return interaction.followUp({
            content:
                "This session is no longer avaliable to interact with <:Sapo:1078667608196391034>",
            ephemeral: true,
        });
    if (!session.share && session.userId !== userId)
    return interaction.followUp({
        content:
            "This session is locked and only accessible by its owner only. Other users can interact once the owner of this session share it using \`/session share\`!",
        ephemeral: true,
    });

    if (session.userId === userId) {
        session.lastUpdated = Date.now();
        await session.save();
    }
    

    return client.manga.handleRead(session.mangaId, interaction, true);
}


exports.info = {
    name: "jumpchapterreadbtn"
};