const {
    SlashCommandSubcommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonStyle
} = require("discord.js");

const readingListDatabase = require("../../database/readingList");

const linksTitle = {
    al: "AniList",
    ap: "AnimePlanet",
    bw: "BookWalker",
    mu: "MangaUpdates",
    nu: "NovelUpdates",
    kt: "Kitsu",
    amz: "Amazon",
    ebj: "eBookJapan",
    mal: "MyAnimeList",
    raw: "Raw",
    engtl: "English",
    cdj: "CDJapan",
};

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

        let options = {
            title: query,
            limit: 1,
        };

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
    const stats = await manga.getStatistics();

    const tags = manga.tags
        .map((tag) => tag.localizedName.en)
        .filter((tag) => Boolean(tag));
    const altTitles = manga.localizedAltTitles.map(
        (title) => Object.values(title)[0]
    );
    const authors = await Promise.all(
        manga.authors.map((author) => author.resolve())
    );
    const artists = await Promise.all(
        manga.artists.map((artist) => artist.resolve())
    );

    const cover = await manga.mainCover.resolve();

    const mangaInfo = {
        authors: authors.length
            ? authors.map((author) => author.name).join(", ")
            : "???",
        artists: artists.length
            ? artists.map((artist) => artist.name).join(", ")
            : "???",
        links:
            manga.links.availableLinks && manga.links.availableLinks.length
                ? manga.links.availableLinks
                      .map((link) => Boolean(linksTitle[link]) ? `[${linksTitle[link]}](${manga.links[link]})` : null)
                      .filter((link) => Boolean(link))
                      .join(", ")
                : "???",
        description: manga.description || "No description provided",
        localizedAltTitles: altTitles.length ? altTitles.join(", ") : "???",
        tags: tags.length ? tags.join(", ") : "???",
        status: manga.status || "???",
        lastChapter: Boolean(manga.lastChapter)
            ? `Chapter ${manga.lastChapter}`
            : "???",
        year: manga.year || "???",
        rating: stats && stats.rating ? `${stats.rating.average} ⭐` : "???",
    };

    const embed = new EmbedBuilder()
        .setColor("FF6740")
        .setURL(`https://mangadex.org/title/${manga.id}`)
        .setTitle(manga.title)
        .setDescription(
            mangaInfo.description.length > 4000
                ? mangaInfo.description.substring(0, 4000) + "..."
                : mangaInfo.description
        )
        .addFields([
            {
                name: "✍ Authors",
                value:
                    mangaInfo.authors.length > 1020
                        ? mangaInfo.authors.substring(0, 1020) + "..."
                        : mangaInfo.authors,
                inline: true,
            },
            {
                name: "🎨 Artists",
                value:
                    mangaInfo.artists.length > 1020
                        ? mangaInfo.artists.substring(0, 1020) + "..."
                        : mangaInfo.artists,
                inline: true,
            },
            {
                name: "🧨 Publication Year",
                value: `${mangaInfo.year}`,
                inline: true,
            },
            {
                name: "📜 Status",
                value: mangaInfo.status,
                inline: true,
            },
            {
                name: "💯 Average rating",
                value: mangaInfo.rating,
                inline: true,
            },
            {
                name: "📚 Last chapter",
                value: mangaInfo.lastChapter,
                inline: true,
            },
            {
                name: "🗯 Alternate title",
                value:
                    mangaInfo.localizedAltTitles.length > 1020
                        ? mangaInfo.localizedAltTitles.substring(0, 1020) +
                          "..."
                        : mangaInfo.localizedAltTitles,
            },
            {
                name: "🏷️ Tags",
                value:
                    mangaInfo.tags.length > 1020
                        ? mangaInfo.tags.substring(0, 1020) + "..."
                        : mangaInfo.tags,
            },
            {
                name: "💬 Links",
                value:
                    mangaInfo.links.length > 1020
                        ? mangaInfo.links.substring(0, 1020) + "..."
                        : mangaInfo.links,
            },
        ]);
    if (cover && cover.imageSource) embed.setThumbnail(cover.imageSource);
    if (!query) {
        return interaction.editReply({
            components: [],
            embeds: [embed],
            fetchReply: true,
            content: Boolean(bridge) ? "Here you go!" : null
        });
    } else {
        const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
            .setLabel("Add to reading list")
            .setCustomId("addreadingbtn")
            .setStyle(ButtonStyle.Success)
            .setEmoji("📚"),
            new ButtonBuilder()
                .setLabel("Search again with query")
                .setCustomId("showmorebtn")
                .setStyle(ButtonStyle.Success)
                .setEmoji("🔎"),
        ]);
        const filter = async res => {
            if (res.customId === 'showmorebtn' || res.customId === 'addreadingbtn') {
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
            components: [row],
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
                collector.stop();
                await readingListDatabase.findOneAndUpdate({
                    mangaId: manga.id,
                    userId: interaction.user.id
                }, {
                    mangaId: manga.id,
                    userId: interaction.user.id
                }, {
                    upsert: true,
                    new: true,
                })
                return res.followUp({ content: `Successfully added **${manga.title}** to your reading list 📖` })
            };
        });
        collector.on('end', async(collection, reason) => {
            if (reason !== 'time' && !collection.filter(i => i.customId === 'addreadingbtn').size) return;
            else {
                row.components.forEach(button => button.setDisabled(true));
                interaction.editReply({
                    components: [row]
                });
            };
        })
    }
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
        ),
};
