const {
    SlashCommandSubcommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonStyle
} = require("discord.js");

const readingListDatabase = require("../../database/readingList");

exports.run = async (client, interaction, bridge) => {
    let manga;
    let query;
    if (!bridge) {
        query = interaction.options.getString("query");
        if (!query)
            return interaction.reply({
                content:
                    "Can you double check the **query** input? <:Sapo:1078667608196391034>",
                ephemeral: true,
            });

        await interaction.deferReply();

        const rating = interaction.options.getString('rating');

        let options = {
            title: query,
            limit: 1,
        };

        if (rating) {
            if (rating === 'erotica') options.contentRating = ["safe","suggestive","erotica"];
            else if (rating === 'pornographic') options.contentRating = ["safe","suggestive","erotica", "pornographic"];
        } else options.contentRating = ["safe","suggestive"];

        const results = await client.manga.search(options);
        if (results.error) {
            interaction.editReply({
                content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${results.message}\``,
                ephemeral: true,
            });
            return;
        }

        if (results.length === 0) {
            return interaction.editReply({
                content: "No results was found <:Sapo:1078667608196391034>",
            });
        }

        manga = results[0];
    } else {
        manga = bridge.bridgedManga;
        if (bridge.bridgedTitle) query = bridge.bridgedTitle;
    }

    const embed = await client.manga.generateEmbedInfo(manga);

    
    if (bridge?.followUp) {
        return interaction.followUp({
            embeds: [embed],
            content: "Here you go!",
            ephemeral: true,
        });
    };
    const database = await readingListDatabase.findOneAndUpdate({
        mangaId: manga.id,
        userId: interaction.user.id
    }, {
        lastUpdated: Date.now(),
    }, {
        new: true
    });
    const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
        .setLabel("Add to reading list")
        .setCustomId("addreadingbtn")
        .setStyle(ButtonStyle.Success)
        .setEmoji("📚")
        .setDisabled(Boolean(database)),
        new ButtonBuilder()
        .setLabel("Remove from reading list")
        .setCustomId("removereadingbtn")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("📚")
        .setDisabled(!Boolean(database)),
        new ButtonBuilder()
        .setLabel("Search again with query")
        .setCustomId("showmorebtn")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔎")
        .setDisabled(!query)
    ]);

    const array = [
        new ButtonBuilder()
        .setLabel('Read from the beginning')
        .setCustomId("startreadinginfobtn")
        .setStyle(ButtonStyle.Success)
        .setEmoji('📖'),
    ];
    if (database?.progress && database?.progressChapterId) array.unshift(new ButtonBuilder().setCustomId(`resumereadinginfobtn`).setLabel(`Resume (Chapter ${database?.progress})`).setEmoji('🔖').setStyle(ButtonStyle.Success));
    const row1 = new ActionRowBuilder().addComponents(array);
    const filter = async res => {
        if (res.customId === 'showmorebtn' || res.customId === 'addreadingbtn' || res.customId === 'startreadinginfobtn' || res.customId === 'removereadingbtn' || res.customId === 'resumereadinginfobtn') {
            if (res.user.id !== interaction.user.id) {
                res.reply({
                    content: `This buttons are for ${interaction.user.toString()} <:hutaoWHEEZE:1085918596955394180>`,
                    ephemeral: true
                });
                return false;
            } else return true;
        } else return false;
    };
    const msg = await interaction.editReply({
        embeds: [embed],
        components: [row, row1],
        fetchReply: true,
        content: Boolean(bridge) ? "Here you go!" : null
    });
    const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter,
        time: 60000
    });
    collector.on('collect', async(res) => {
        if (res.customId === 'showmorebtn') {
            await res.deferUpdate();
            collector.stop();
            const commandFile = client.commands.get('manga');
            const command = commandFile.subCommandsGroup.get('search');
            return command.run(client, interaction, query);
        } else if (res.customId === 'addreadingbtn') {
            await res.deferUpdate();
            await readingListDatabase.findOneAndUpdate({
                mangaId: manga.id,
                userId: interaction.user.id
            }, {
                mangaId: manga.id,
                userId: interaction.user.id,
                lastUpdated: Date.now(),
            }, {
                upsert: true,
                new: true,
            });
            row.components[0].setDisabled(true);
            row.components[1].setDisabled(false);
            await res.editReply({
                components: [row, row1],
            })
            return res.followUp({ content: `Added **${manga.title}** to your reading list 📖`, ephemeral: true })
        } else if (res.customId === 'resumereadinginfobtn') {
            if (!database?.progressChapterId) return;
            collector.stop();
            await res.deferUpdate();
            return client.manga.handleInitialRead({chapterId: database?.progressChapterId}, manga, interaction);
        } else if (res.customId === 'removereadingbtn') {
            await res.deferUpdate();
            await readingListDatabase.findOneAndDelete({
                mangaId: manga.id,
                userId: interaction.user.id
            });

            row.components[0].setDisabled(false);
            row.components[1].setDisabled(true);

            await res.editReply({
                components: [row, row1],
            })
            return res.followUp({ content: `Removed **${manga.title}** from your reading list ❌`, ephemeral: true })
        } else if (res.customId === 'startreadinginfobtn') {
            collector.stop();
            await res.deferUpdate();
            return client.manga.handleRead(manga.id, interaction, true);
        };
    });
    collector.on('end', async(collection, reason) => {
        if (reason !== 'time') return;
        else {
            row.components.forEach(button => button.setDisabled(true));
            interaction.editReply({
                components: [row]
            });
        };
    });

};

exports.info = {
    name: "info",
    slash: new SlashCommandSubcommandBuilder()
        .setName("info")
        .setDescription(
            "Display info for a specific manga. If you want more precise results, use the /manga search command"
        )
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription(
                    "The title of the manga to look for."
                )
                .setRequired(true)
        )
        .addStringOption(option => option.setName('rating').setDescription('Option to include manga with explicit content').addChoices({
            "name": "Erotica",
            "value": "erotica"
        }, {
            "name": "Erotica and Pornographic",
            "value": "pornographic"
        })),
};
