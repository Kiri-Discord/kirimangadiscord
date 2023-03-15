module.exports = class Util {
    static fetchSubCommand(interaction) {
        try {
            const subCommandGroupName = interaction.options.getSubcommandGroup();
            const subCommandName = interaction.options.getSubcommand();
            return { subCommandGroupName, subCommandName }
        } catch {
            return null;
        };
    };
}