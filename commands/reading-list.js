const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonStyle,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder
} = require("discord.js");
const { flag } = require('../handler/countryToEmoji.js');
const { paginatedMangaReadingList } = require('../handler/Util.js');


const readingListDatabase = require("../database/readingList");

exports.run = async (client, interaction) => {
    await interaction.deferReply();
    const readingData = await readingListDatabase.find({
        userId: interaction.user.id,
    });
    if (!readingData.length) {
        return interaction.editReply({
            content: "You have no manga in your reading list yet <:Sapo:1078667608196391034>. Search for mangas using `/manga search` and `/manga info` to add a manga to your reading list.",
            ephemeral: true,
        });
    };
    const mangaIds = readingData.map((manga, index) => {
        return {
            id: manga.mangaId,
            progress: manga.progress,
            readingLanguage: manga.readingLanguage,
        }
    });


    const fetched = await client.manga.search({
        ids: mangaIds.map((manga) => manga.id),
        limit: Infinity
    });
    const mangasArray = fetched.map((manga, index) => {
        return {
            ...manga,
            progress: mangaIds.find((m) => m.id === manga.id).progress,
            index,
            readingLanguage: mangaIds.find((m) => m.id === manga.id).readingLanguage,
        };
    })

    // if (mangaIds.length > 100) {
    //     const mangaChunks = [];
    //     while (mangaIds.length) {
    //         const toAdd = mangaIds.splice(0, mangaIds.length >= 100 ? 100 : mangaIds.length);
    //         mangaChunks.push(toAdd);
    //     };
    //     const fetchedMangas = await Promise.all(mangaChunks.map(async(chunk) => {
    //         const fetched = await client.manga.search({
    //             ids: chunk.map((manga) => manga.id),
    //             limit: Infinity
    //         });
    //         return fetched.map((manga) => {
    //             return {
    //                 ...manga,
    //                 progress: mangaIds.find((m) => m.id === manga.id).progress,
    //                 readingLanguage: mangaIds.find((m) => m.id === manga.id).readingLanguage,
    //             }
    //         })
    //     })).then((mangas) => mangas.flat(1).map((manga, index) => {
    //         return {
    //             ...manga,
    //             index
    //         }
    //     }));
    //     mangasArray = fetchedMangas;
    // } else {

    // };
    const fetchedMangas = mangasArray.map((manga) => {
        return {
            title: manga.localizedTitle[manga.localizedTitle.availableLocales[0]],
            originalLanguage: manga.originalLanguage,
            status: manga.status,
            id: manga.id,
            index: manga.index,
            progress: manga.progress,
            readingLanguage: manga.readingLanguage
        }
    });
    const row2 = new ActionRowBuilder()
    .addComponents([
        new ButtonBuilder()
        .setLabel('Show more info')
        .setCustomId("startreadingreadinglistbtn")
        .setStyle(ButtonStyle.Success)
        .setEmoji('📖'),
    ]);
    if (fetchedMangas.length > 10) {
        const resLength = fetchedMangas.length;
        const mangaChunks = [];
        while (fetchedMangas.length) {
            const toAdd = fetchedMangas.splice(0, fetchedMangas.length >= 10 ? 10 : fetchedMangas.length);
            mangaChunks.push(toAdd);
        };
        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Previous')
            .setCustomId("previousreadinglistpagebtn")
            .setEmoji('⬅️')
            .setStyle(2)
            .setDisabled(true),
            new ButtonBuilder()
            .setLabel('Jump to')
            .setCustomId('jumpreadinglistpagebtn')
            .setEmoji('↗️')
            .setStyle(2),
            new ButtonBuilder()
            .setLabel('Next')
            .setCustomId("nextreadinglistpagebtn")
            .setEmoji('➡️')
            .setStyle(2)
        ]);
        const arrEmbeds = mangaChunks.map((arr, index) => {
            const embed = new EmbedBuilder()
            .setColor("FF6740")
            .setTitle("Your reading list")
            .setDescription(arr.map((res) => {
                const readingStatusString = res.progress ? `Reading chapter ${res.progress}` : `Haven't read`;
                let readingLanguage;
                if (!res.readingLanguage) readingLanguage = '';
                else {
                    const fullName = client.languageHandler.getName(res.readingLanguage, "en");
                    if (fullName) readingLanguage = fullName;
                    else readingLanguage = `\`${res.readingLanguage}\``;
                }
                let countryFlag;
                if (!res.originalLanguage) countryFlag = '';
                else {
                    const fullName = client.languageHandler.getName(res.originalLanguage, "en");
                    const emojiFlag = flag(fullName);
                    if (emojiFlag) countryFlag = emojiFlag;
                    else countryFlag = `\`${res.originalLanguage}\``;
                }
                return `**${res.index + 1}** • ${countryFlag} ${res.title} **(${res.status})** - *${readingStatusString} (${readingLanguage})*`
            }).join("\n"));
            return embed;
        });
        const msg = await interaction.editReply({
            embeds: [arrEmbeds[0]],
            components: [row, row2],
            content: `Page 1 of ${arrEmbeds.length}`,
            fetchReply: true
        });
        const filter = async res => {
            if (res.user.id !== interaction.user.id) {
                res.reply({
                    content: `Those buttons are for ${interaction.user.toString()} <:hutaoWHEEZE:1085918596955394180>`,
                    ephemeral: true
                });
                return false;
            } else return true
        };
        const result = await paginatedMangaReadingList(interaction, arrEmbeds, msg, [row, row2], filter, interaction.user.id, resLength);
        if (result.reason !== 'time') {
            const targetManga = mangasArray[result.value - 1];
            return client.manga.handleRead(targetManga.id, interaction);
        }
    } else {
        const embed = new EmbedBuilder()
        .setColor("FF6740")
        .setTitle("Your reading list")
        .setDescription(fetchedMangas.map((res) => {
            const readingStatusString = res.progress ? `Reading chapter ${res.progress}` : `Haven't read`;
            let readingLanguage;
            if (!res.readingLanguage) readingLanguage = '';
            else {
                const fullName = client.languageHandler.getName(res.readingLanguage, "en");
                if (fullName) readingLanguage = fullName;
                else readingLanguage = `\`${res.readingLanguage}\``;
            }
            let countryFlag;
            if (!res.originalLanguage) countryFlag = '';
            else {
                const fullName = client.languageHandler.getName(res.originalLanguage, "en");
                const emojiFlag = flag(fullName);
                if (emojiFlag) countryFlag = emojiFlag;
                else countryFlag = `\`${res.originalLanguage}\``;
            }
            return `**${res.index + 1}** • ${countryFlag} ${res.title} **(${res.status})** - *${readingStatusString} (${readingLanguage})*`
        }).join("\n"));

        const msg = await interaction.editReply({ embeds: [embed], fetchReply: true, components: [row2] });

        const filter = async res => {
            if (res.customId !== 'startreadingreadinglistbtn') return;
            if (res.user.id !== interaction.user.id) {
                res.reply({
                    content: `Those buttons are for ${interaction.user.toString()} <:hutaoWHEEZE:1085918596955394180>`,
                    ephemeral: true
                });
                return false;
            } else return true
        };

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter,
            time: 60000
        });

        collector.on('collect', async(res) => {
            const modal1 = new ModalBuilder()
            .setCustomId('inforeadinglist')
            .setTitle('Display manga info');
            const input1 = new TextInputBuilder()
            .setMinLength(1)
            .setRequired(true)
            .setCustomId('mangaNumberReadingList')
            .setLabel(`Which manga would you like to show more info?`)
            .setPlaceholder(`1 - ${fetchedMangas.length}`)
            .setStyle(TextInputStyle.Short);
            const row1 = new ActionRowBuilder().addComponents(input1);
            modal1.addComponents(row1);
            await res.showModal(modal1);

            const mangaModalResult = await res.awaitModalSubmit({
                filter: (i) => {
                    if (i.customId !== 'inforeadinglist' || i.user.id !== interaction.user.id) return false;
                    else if (isNaN(i.fields.getTextInputValue('mangaNumberReadingList')) || Number(i.fields.getTextInputValue('mangaNumberReadingList')) > fetchedMangas.length || Number(i.fields.getTextInputValue('mangaNumberReadingList')) < 1) {
                        i.reply({
                            content: `You should enter a vaild number \`1 - ${fetchedMangas.length}\` <:hutaoWHEEZE:1085918596955394180>`,
                            ephemeral: true
                        })
                        return false
                    } else return true;
                },
                time: 15000
            }).catch(() => null);
            if (mangaModalResult) {
                collector.stop();
                await mangaModalResult.deferUpdate();
                const number = mangaModalResult.fields.getTextInputValue('mangaNumberReadingList');
                const targetManga = mangasArray[Number(number) - 1];
                return client.manga.handleRead(targetManga.id, interaction);
            };
        });
        collector.on('end', async(collection, reason) => {
            if (reason !== 'time') return;
            else {
                row2.components.forEach(button => button.setDisabled(true));
                interaction.editReply({
                    components: [row2]
                });
            };
        })
    }
};

exports.info = {
    name: "reading-list",
    slash: new SlashCommandBuilder()
        .setName("reading-list")
        .setDescription(
            "Display your manga reading list."
        )
};