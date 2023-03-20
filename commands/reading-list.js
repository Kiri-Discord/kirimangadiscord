const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonStyle
} = require("discord.js");
const { flag } = require('../handler/countryToEmoji.js');
const iso = require('iso-639-1');

const readingListDatabase = require("../database/readingList");

exports.run = async (client, interaction) => {
    interaction.reply({
        content: "executing",
        ephemeral: true,
    });
    // await interaction.deferReply();
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
            index: index + 1
        }
    });
    let mangasArray;

    if (mangaIds.length > 100) {
        const mangaChunks = [];
        while (mangaIds.length) {
            const toAdd = mangaIds.splice(0, mangaIds.length >= 100 ? 100 : mangaIds.length);
            mangaChunks.push(toAdd);
        };
        const fetchedMangas = await Promise.all(mangaChunks.map(async(chunk) => {
            const fetched = await client.manga.search({
                ids: chunk.map((manga) => manga.id)
            });
            return fetched.map((manga) => {
                return {
                    ...manga,
                    progress: mangaIds.find((m) => m.id === manga.id).progress,
                    index: mangaIds.find((m) => m.id === manga.id).index
                }
            })
        })).then((mangas) => mangas.flat(1));
        mangasArray = fetchedMangas;
    } else {
        const fetched = await client.manga.search({
            ids: mangaIds.map((manga) => manga.id)
        });

        mangasArray = fetched.map((manga, index) => {
            return {
                ...manga,
                progress: mangaIds.find((m) => m.id === manga.id).progress,
                index: mangaIds.find((m) => m.id === manga.id).index
            };
        })
    };
    const fetchedMangas = mangasArray.map((manga) => {
        return {
            title: manga.localizedTitle[manga.localizedTitle.availableLocales[0]],
            originalLanguage: manga.originalLanguage,
            status: manga.status,
            id: manga.id,
            index: manga.index,
            progress: manga.progress
        }
    });
    const manga = fetchedMangas[0];
    return client.manga.handleRead(manga.id);

    // const embed = new EmbedBuilder()
    // .setColor("FF6740")
    // .setTitle("Your reading list")
    // .setDescription(fetchedMangas.map((res) => {
    //     let countryFlag
    //     if (!res.originalLanguage) countryFlag = '';
    //     else {
    //         const fullName = iso.getName(res.originalLanguage);
    //         const emojiFlag = flag(fullName);
    //         if (emojiFlag) countryFlag = emojiFlag;
    //         else countryFlag = `\`${res.originalLanguage}\``;
    //     }
    //     return `**${res.index}** • ${countryFlag} ${res.title} **(${res.status})**`
    // }).join("\n"));

    // const row = new ActionRowBuilder()
    // .addComponents([
    //     new ButtonBuilder()
    //     .setLabel('Previous')
    //     .setCustomId("previousbtn")
    //     .setEmoji('⬅️')
    //     .setStyle(2),
    //     new ButtonBuilder()
    //     .setLabel('Jump to')
    //     .setCustomId('jumpbtn')
    //     .setEmoji('↗️')
    //     .setStyle(2),
    //     new ButtonBuilder()
    //     .setLabel('Next')
    //     .setCustomId("nextbtn")
    //     .setEmoji('➡️')
    //     .setStyle(2)
    // ]);
    // const row2 = new ActionRowBuilder()
    // .addComponents([
    //     new ButtonBuilder()
    //     .setLabel('Read')
    //     .setCustomId("showinfobtn")
    //     .setStyle(ButtonStyle.Success)
    //     .setEmoji('📖'),
    // ])

    // return interaction.editReply({
    //     embeds: [embed],
    //     components: [row, row2]
    // })  

};

exports.info = {
    name: "reading-list",
    slash: new SlashCommandBuilder()
        .setName("reading-list")
        .setDescription(
            "Display your manga reading list."
        )
};