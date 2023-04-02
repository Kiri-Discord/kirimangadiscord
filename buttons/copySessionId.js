const readingSessionDatabase = require("../database/readingSessions");

exports.run = async (client, interaction) => {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    await interaction.deferUpdate();

    const session = await readingSessionDatabase.findOneAndUpdate({
        messageId,
        userId,
    });
    if (!session) return interaction.followUp({ content: 'You are not reading this manga <:hutaoWHEEZE:1085918596955394180>', ephemeral : true });
    return interaction.followUp({ content: `This reading session ID is ||\`${session.sessionId}\`||`, ephemeral : true });
}


exports.info = {
    name: "copyidreadingbtn"
};