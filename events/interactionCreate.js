const { fetchSubCommand } = require('../handler/Util');

module.exports = async(client, interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const commandFile = client.commands.get(interaction.commandName);
    if (!commandFile) {
        return interaction.reply({
            content: `:grey_question: That slash command is probably outdated! You can try again in an hour as Discord are updating the database across all servers (including yours!)`,
            ephemeral: true
        });
    };
    const subOptions = fetchSubCommand(interaction);
    try {
        if (subOptions) {
            if (subOptions.subCommandName && subOptions.subCommandGroupName) {
                const group = commandFile.subCommandsGroup.get(subOptions.subCommandGroupName);
                const command = group.subCommands.get(subOptions.subCommandName);
                client.logger.info(`${interaction.user.tag} (${interaction.user.id}) from ${interaction.inGuild() ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM'} ran an application command: /${interaction.commandName} ${subOptions.subCommandGroupName} ${subOptions.subCommandName}`);
                command.run(client, interaction);
            } else {
                const command = commandFile.subCommandsGroup.get(subOptions.subCommandName);
                client.logger.info(`${interaction.user.tag} (${interaction.user.id}) from ${interaction.inGuild() ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM'} ran an application command: /${interaction.commandName} ${subOptions.subCommandName}`);
                command.run(client, interaction);
            }
        } else {
            client.logger.info(`${interaction.user.tag} (${interaction.user.id}) from ${interaction.inGuild() ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM'} ran an application command: /${interaction.commandName}`);
            commandFile.run(client, interaction);
        }
    } catch (error) {
        client.logger.error(error);
        return interaction.reply({ content: `Sorry, I encountered an error while executing that command for you. Please seek some support if this happen frequently.`, ephemeral: true })
    };
};