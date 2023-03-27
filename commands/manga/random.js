const {
    SlashCommandSubcommandBuilder
} = require("discord.js");


exports.run = async (client, interaction) => {
    await interaction.deferReply();
    const result = await client.manga.getRandomManga();
    if (result.message === "No results found.") {
        interaction.followUp({
            content: `No manga was found for you as of now. Can you try again later? <:Sapo:1078667608196391034>`,
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
    return command.run(client, interaction, { bridgedManga: result });
}

exports.info = {
    name: "random",
    slash: new SlashCommandSubcommandBuilder()
        .setName("random")
        .setDescription(
            "Suggest a random manga to read."
        )
};
