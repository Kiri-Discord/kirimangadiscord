const { fetchSubCommand } = require("../handler/Util");

module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
        const commandFile = client.commands.get(interaction.commandName);
        if (!commandFile && !interaction.isAutocomplete()) {
            return interaction.reply({
                content: `:grey_question: That slash command is probably outdated! This will dissapear in an hour as Discord are updating our command database across all servers (including yours!)`,
                ephemeral: true,
            });
        }
        const subOptions = fetchSubCommand(interaction);
        try {
            if (subOptions) {
                if (subOptions.subCommandName && subOptions.subCommandGroupName) {
                    const group = commandFile.subCommandsGroup.get(
                        subOptions.subCommandGroupName
                    );
                    const command = group.subCommands.get(
                        subOptions.subCommandName
                    );
                    if (interaction.isAutocomplete())
                        return command.autocomplete(client, interaction);
                    else {
                        client.logger.info(
                            `${interaction.user.tag} (${
                                interaction.user.id
                            }) from ${
                                interaction.inGuild()
                                    ? `${interaction.guild.name} (${interaction.guild.id})`
                                    : "DM"
                            } ran an application command: /${
                                interaction.commandName
                            } ${subOptions.subCommandGroupName} ${
                                subOptions.subCommandName
                            }`
                        );
                        return command.run(client, interaction);
                    }
                } else {
                    const command = commandFile.subCommandsGroup.get(
                        subOptions.subCommandName
                    );
                    if (interaction.isAutocomplete())
                        return command.autocomplete(client, interaction);
                    else {
                        client.logger.info(
                            `${interaction.user.tag} (${
                                interaction.user.id
                            }) from ${
                                interaction.inGuild()
                                    ? `${interaction.guild.name} (${interaction.guild.id})`
                                    : "DM"
                            } ran an application command: /${
                                interaction.commandName
                            } ${subOptions.subCommandName}`
                        );
                        return command.run(client, interaction);
                    }
                }
            } else {
                if (interaction.isAutocomplete())
                    return commandFile.autocomplete(client, interaction);
                else {
                    client.logger.info(
                        `${interaction.user.tag} (${interaction.user.id}) from ${
                            interaction.inGuild()
                                ? `${interaction.guild.name} (${interaction.guild.id})`
                                : "DM"
                        } ran an application command: /${interaction.commandName}`
                    );
                    return commandFile.run(client, interaction);
                }
            }
        } catch (error) {
            client.logger.error(error);
            if (!interaction.isAutocomplete())
                return interaction.reply({
                    content: `Sorry, I encountered an error while executing that command for you. <:Sapo:1078667608196391034> Please seek some support if this happen frequently.`,
                    ephemeral: true,
                });
        }
    } else if (interaction.isButton()) {
        const commandFile = client.buttonCommands.get(interaction.customId);
        if (!commandFile) return;
        return commandFile.run(client, interaction).catch((error) => {
            client.logger.error(error);
        });
    }
};
