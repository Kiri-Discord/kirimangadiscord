const readingSessionDatabase = require("../database/readingSessions");

exports.run = async (client, interaction) => {
    const messageId = interaction.message.id;

    await interaction.deferUpdate();

    const session = await readingSessionDatabase.findOne({
        messageId
    });
    if (!session) return interaction.followUp({ content: 'This session is not avaliable to interact with anymore! <:Sapo:1078667608196391034>', ephemeral : true });

    const { mangaId } = session;

    const result = await client.manga.getManga(mangaId);
    if (result.message === "No results found.") {
        interaction.followUp({
            content: `That manga isn't avaliable to read anymore <:Sapo:1078667608196391034>`,
            ephemeral: true,
        });
        return;
    }
    if (result.error) {
        interaction.followUp({
            content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${result.message}\``,
            ephemeral: true,
        });
        return;
    };
    const commandFile = client.commands.get('manga');
    const command = commandFile.subCommandsGroup.get('info');
    return command.run(client, interaction, { bridgedManga: result, followUp: true });
}
exports.info = {
    name: "showmangainforeadbtn"
};