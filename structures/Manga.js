const MFA = require("mangadex-full-api");
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const readingListDatabase = require('../database/readingList');
const readingSessionDatabase = require('../database/readingSessions');
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

const { v4: uuidv4 } = require('uuid');

module.exports = class Manga {
    constructor(client) {
        this.client = client;
    }
    async generateEmbedInfo(manga) {
        const stats = await manga.getStatistics();

        const tags = manga.tags
            .map((tag) => tag.localizedName.en)
            .filter((tag) => Boolean(tag));
        const altTitles = manga.localizedAltTitles.map(
            (title) => Object.values(title)[0]
        );

        const authors = await MFA.resolveArray(manga.authors);
        const artists = await MFA.resolveArray(manga.artists);
    
        const cover = await manga.mainCover.resolve();
    
        const mangaInfo = {
            title: manga.title || "???",
            url: `https://mangadex.org/title/${manga.id}`,
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
            lastChapter: manga.lastChapter || "???",
            year: String(manga.year) || "???",
            rating: stats?.rating?.average ? `${stats.rating.average} ⭐` : "???",
            cover: cover?.imageSource || null,
        };
    
        const embed = new EmbedBuilder()
            .setColor("FF6740")
            .setURL(mangaInfo.url)
            .setTitle(mangaInfo.title)
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
                    value: mangaInfo.year,
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
        if (mangaInfo.cover) embed.setThumbnail(mangaInfo.cover);
        return embed;
    }
    async search(options) {
        if (!options)
            return {
                error: true,
                message: "No options provided.",
            };
        const results = await MFA.Manga.search(options, true).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message,
            };
        });
        return results;
    };
    async getChapter(id) {
        if (!id)
            return {
                error: true,
                message: "No ID provided.",
            };
        const results = await MFA.Chapter.get(id, true).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message,
            };
        });
        if (!results) return {
            error: true,
            message: "No results found.",
        }
        return results;
    };
    async getManga(id) {
        if (!id) return {
            error: true,
            message: "No ID provided.",
        };
        const results = await MFA.Manga.get(id, true).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message,
            };
        });
        if (!results) return {
            error: true,
            message: "No results found.",
        }
        return results;
    }
    async getRandomManga() {
        const results = await MFA.Manga.getRandom(undefined, true).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message,
            };
        });
        if (!results) return {
            error: true,
            message: "No results found.",
        }
        return results;
    }
    async resumeReading({ sessionId, mangaId }, interaction) {
        let session;
        if (sessionId) {
            session = await readingSessionDatabase.findOneAndUpdate({
                sessionId,
                userId: interaction.user.id
            }, {
                lastUpdated: Date.now()
            }, {
                new: true
            });
        } else if (mangaId) {
            session = await readingSessionDatabase.findOneAndUpdate({
                mangaId,
                userId: interaction.user.id
            }, {
                lastUpdated: Date.now()
            }, {
                new: true
            });
        } else {
            session = null;
        };

        if (!session) return false;

        const { chapterId, currentChapter, mangaName } = session;

        const fetchedChapter = await this.getChapter(chapterId);
        if (fetchedChapter.message === "No results found.") {
            return false;
        };
        if (fetchedChapter.error) {
            return false;
        };

        if (fetchedChapter.isExternal) {
            let uploader = await fetchedChapter.uploader.resolve();
            let resolvedGroups = await MFA.resolveArray(fetchedChapter.groups)
            let groupNames = resolvedGroups.map(elem => elem.name);

            const row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Previous chapter')
                .setCustomId("prevchapterreadbtn")
                .setEmoji('⏪')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId("prevpagereadbtn")
                .setEmoji('⬅️')
                .setStyle(2)
                .setDisabled(true),
                new ButtonBuilder()
                .setLabel('Jump to')
                .setCustomId('jumppagereadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Next')
                .setCustomId("nextpagereadbtn")
                .setEmoji('➡️')
                .setStyle(2)
                .setDisabled(true),
                new ButtonBuilder()
                .setLabel('Next chapter')
                .setCustomId("nextchapterreadbtn")
                .setEmoji('⏩')
                .setStyle(2),
            ]);
            const row1 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Show chapters')
                .setCustomId('jumpchapterreadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('F.A.Q')
                .setCustomId("frequentquestionreadbtn")
                .setEmoji('📜')
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel('Show manga info')
                .setCustomId("showmangainforeadbtn")
                .setStyle(ButtonStyle.Success)
                .setEmoji('ℹ️'),
                new ButtonBuilder()
                .setLabel('Show session ID')
                .setCustomId("copyidreadingbtn")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setLabel('Notify on/off')
                .setCustomId("notifyreadingbtn")
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔔'),
            ]);

            const embed = new EmbedBuilder()
            .setDescription(`**Chapter ${fetchedChapter.chapter || 0}${Boolean(fetchedChapter.title) ? `: ${fetchedChapter.title}` : ''}**\n\nThis chapter is external, meaning that it is not hosted on our servers. You can read it here: ${fetchedChapter.externalUrl}`)
            .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` });

            const msg = await interaction.editReply({ embeds: [embed], components: [row, row1], content: `Page 1 of 1 - <@${interaction.user.id}>'s reading session` });

            interaction.followUp({ content: `Resumed your reading session for **${mangaName}**!`, ephemeral: true });
            session.messageId = msg.id;
    
            await session.save();
    
            return true;

        } else {
            let pages = await fetchedChapter.getReadablePages(true).catch(() => null);
            if (!pages || !pages.length) return false;
    
            let uploader = await fetchedChapter.uploader.resolve();
            let resolvedGroups = await MFA.resolveArray(fetchedChapter.groups)
            let groupNames = resolvedGroups.map(elem => elem.name);
    
            const newPage = session.currentPage;
    
            const row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Previous chapter')
                .setCustomId("prevchapterreadbtn")
                .setEmoji('⏪')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId("prevpagereadbtn")
                .setEmoji('⬅️')
                .setStyle(2).setDisabled(newPage === 1),
                new ButtonBuilder()
                .setLabel('Jump to')
                .setCustomId('jumppagereadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Next')
                .setCustomId("nextpagereadbtn")
                .setEmoji('➡️')
                .setStyle(2).setDisabled(newPage === pages.length),
                new ButtonBuilder()
                .setLabel('Next chapter')
                .setCustomId("nextchapterreadbtn")
                .setEmoji('⏩')
                .setStyle(2),
            ]);
            const row1 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Show chapters')
                .setCustomId('jumpchapterreadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('F.A.Q')
                .setCustomId("frequentquestionreadbtn")
                .setEmoji('📜')
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel('Show manga info')
                .setCustomId("showmangainforeadbtn")
                .setStyle(ButtonStyle.Success)
                .setEmoji('ℹ️'),
                new ButtonBuilder()
                .setLabel('Show session ID')
                .setCustomId("copyidreadingbtn")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setLabel('Notify on/off')
                .setCustomId("notifyreadingbtn")
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔔')
            ]);
    
            const embed = new EmbedBuilder()
            .setDescription(`**Chapter ${currentChapter}${Boolean(fetchedChapter.title) ? `: ${fetchedChapter.title}` : ''}**`)
            .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` })
            .setImage(pages[newPage -  1]);
        
            const msg = await interaction.editReply({ embeds: [embed], components: [row, row1], content: `Page ${newPage} of ${pages.length} - <@${session.userId}>'s reading session` });
    
            interaction.followUp({ content: `Resumed your reading session for **${mangaName}**!`, ephemeral: true });
            session.messageId = msg.id;
    
            await session.save();
    
            return true;
        };
    }
    async handleInitialRead(option, manga, interaction) {
        let chapter;
        if (option.chapterId) {
            const fetchedChapter = await this.getChapter(option.chapterId);
            if (fetchedChapter.message === "No results found.") {
                interaction.followUp({
                    content: `That chapter isn't avaliable to read anymore <:Sapo:1078667608196391034>`,
                    ephemeral: true,
                });
                return;
            }
            if (fetchedChapter.error) {
                interaction.followUp({
                    content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${fetchedChapter.message}\``,
                    ephemeral: true,
                });
                return;
            };
            chapter = fetchedChapter;
        } else {
            chapter = option.chapter
        }
        if (chapter.isExternal) {
            let uploader = await chapter.uploader.resolve();
            let resolvedGroups = await MFA.resolveArray(chapter.groups)
            let groupNames = resolvedGroups.map(elem => elem.name);
            

            const row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Previous chapter')
                .setCustomId("prevchapterreadbtn")
                .setEmoji('⏪')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId("prevpagereadbtn")
                .setEmoji('⬅️')
                .setStyle(2)
                .setDisabled(true),
                new ButtonBuilder()
                .setLabel('Jump to')
                .setCustomId('jumppagereadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Next')
                .setCustomId("nextpagereadbtn")
                .setEmoji('➡️')
                .setStyle(2)
                .setDisabled(true),
                new ButtonBuilder()
                .setLabel('Next chapter')
                .setCustomId("nextchapterreadbtn")
                .setEmoji('⏩')
                .setStyle(2),
            ]);
            const row1 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Show chapters')
                .setCustomId('jumpchapterreadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('F.A.Q')
                .setCustomId("frequentquestionreadbtn")
                .setEmoji('📜')
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel('Show manga info')
                .setCustomId("showmangainforeadbtn")
                .setStyle(ButtonStyle.Success)
                .setEmoji('ℹ️'),
                new ButtonBuilder()
                .setLabel('Show session ID')
                .setCustomId("copyidreadingbtn")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setLabel('Notify on/off')
                .setCustomId("notifyreadingbtn")
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔔'),,
            ]);

            const embed = new EmbedBuilder()
            .setDescription(`**Chapter ${chapter.chapter || 0}${Boolean(chapter.title) ? `: ${chapter.title}` : ''}**\n\nThis chapter is external, meaning that it is not hosted on our servers. You can read it here: ${chapter.externalUrl}`)
            .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` });

            const msg = await interaction.editReply({ embeds: [embed], components: [row, row1], content: `Page 1 of 1 - <@${interaction.user.id}>'s reading session` });

            const uuid = uuidv4();
            const session = await readingSessionDatabase.findOne({
                mangaId: manga.id,
                userId: interaction.user.id
            });
    
            if (!session) {
                const session = new readingSessionDatabase({
                    translatedLanguage: chapter.translatedLanguage,
                    chapterId: chapter.id,
                    messageId: msg.id,
                    mangaId: manga.id,
                    mangaName: manga.title,
                    userId: interaction.user.id,
                    sessionId: uuid,
                    currentChapter: chapter.chapter || 0,
                    currentPage: 1,
                });
        
                await session.save();
    
                const readingData = await readingListDatabase.findOne({
                    mangaId: manga.id,
                    userId: interaction.user.id
                });
                if (!readingData) return;
                else {
                    readingData.lastUpdated = Date.now();
                    readingData.progressChapterId = chapter.id;
                    if (!readingData.notifyChapter || Number(readingData.notifyChapter) < Number(chapter.chapter)) {
                        readingData.notifyChapter = chapter.chapter;
                    }
                    readingData.readingLanguage = chapter.translatedLanguage;
                    readingData.progress = chapter.chapter;
                    await readingData.save();
                    return;
                }
            } else {
                session.lastUpdated = Date.now();
                session.chapterId = chapter.id;
                session.messageId = msg.id;
                session.currentChapter = chapter.chapter || 0;
                session.currentPage = 1;
                session.translatedLanguage = chapter.translatedLanguage
    
                await session.save();
    
                const readingData = await readingListDatabase.findOne({
                    mangaId: manga.id,
                    userId: interaction.user.id
                });
                if (!readingData) return;
                else {
                    readingData.lastUpdated = Date.now();
                    readingData.progressChapterId = chapter.id;
                    if (!readingData.notifyChapter || Number(readingData.notifyChapter) < Number(chapter.chapter)) {
                        readingData.notifyChapter = chapter.chapter;
                    }
                    readingData.readingLanguage = chapter.translatedLanguage;
                    readingData.progress = chapter.chapter;
                    await readingData.save();
                    return;
                }
            };
        } else {
            let pages = await chapter.getReadablePages(true).catch(() => null);
            if (!pages || !pages.length) return interaction.editReply({ content: `An error occured when i go grab the pages. (likely not from your side) Please inform the developer about this.` });
            let uploader = await chapter.uploader.resolve();
            let resolvedGroups = await MFA.resolveArray(chapter.groups)
            let groupNames = resolvedGroups.map(elem => elem.name);
    
            const row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Previous chapter')
                .setCustomId("prevchapterreadbtn")
                .setEmoji('⏪')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Previous')
                .setCustomId("prevpagereadbtn")
                .setEmoji('⬅️')
                .setStyle(2).setDisabled(true),
                new ButtonBuilder()
                .setLabel('Jump to')
                .setCustomId('jumppagereadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Next')
                .setCustomId("nextpagereadbtn")
                .setEmoji('➡️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('Next chapter')
                .setCustomId("nextchapterreadbtn")
                .setEmoji('⏩')
                .setStyle(2),
            ]);
            const row1 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setLabel('Show chapters')
                .setCustomId('jumpchapterreadbtn')
                .setEmoji('↗️')
                .setStyle(2),
                new ButtonBuilder()
                .setLabel('F.A.Q')
                .setCustomId("frequentquestionreadbtn")
                .setEmoji('📜')
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel('Show manga info')
                .setCustomId("showmangainforeadbtn")
                .setStyle(ButtonStyle.Success)
                .setEmoji('ℹ️'),
                new ButtonBuilder()
                .setLabel('Show session ID')
                .setCustomId("copyidreadingbtn")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setLabel('Notify on/off')
                .setCustomId("notifyreadingbtn")
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔔'),
            ]);
            
    
            const embed = new EmbedBuilder()
            .setDescription(`**Chapter ${chapter.chapter || 0}${Boolean(chapter.title) ? `: ${chapter.title}` : ''}**`)
            .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` })
            .setImage(pages[0]);
    
            const msg = await interaction.editReply({ embeds: [embed], components: [row, row1], content: `Page 1 of ${pages.length} - <@${interaction.user.id}>'s reading session` });
            const uuid = uuidv4();
            const session = await readingSessionDatabase.findOne({
                mangaId: manga.id,
                userId: interaction.user.id
            });
    
            if (!session) {
                const session = new readingSessionDatabase({
                    translatedLanguage: chapter.translatedLanguage,
                    chapterId: chapter.id,
                    messageId: msg.id,
                    mangaId: manga.id,
                    mangaName: manga.title,
                    userId: interaction.user.id,
                    sessionId: uuid,
                    currentChapter: chapter.chapter || 0,
                    currentPage: 1,
                });
        
                await session.save();
    
                const readingData = await readingListDatabase.findOne({
                    mangaId: manga.id,
                    userId: interaction.user.id
                });
                if (!readingData) return;
                else {
                    readingData.lastUpdated = Date.now();
                    readingData.progressChapterId = chapter.id;
                    if (!readingData.notifyChapter || Number(readingData.notifyChapter) < Number(chapter.chapter)) {
                        readingData.notifyChapter = chapter.chapter;
                    }
                    readingData.readingLanguage = chapter.translatedLanguage;
                    readingData.progress = chapter.chapter;
                    await readingData.save();
                    return;
                }
            } else {
                session.lastUpdated = Date.now();
                session.chapterId = chapter.id;
                session.messageId = msg.id;
                session.currentChapter = chapter.chapter || 0;
                session.currentPage = 1;
                session.translatedLanguage = chapter.translatedLanguage
    
                await session.save();
    
                const readingData = await readingListDatabase.findOne({
                    mangaId: manga.id,
                    userId: interaction.user.id
                });
                if (!readingData) return;
                else {
                    readingData.lastUpdated = Date.now();
                    readingData.progressChapterId = chapter.id;
                    if (!readingData.notifyChapter || Number(readingData.notifyChapter) < Number(chapter.chapter)) {
                        readingData.notifyChapter = chapter.chapter;
                    }
                    readingData.readingLanguage = chapter.translatedLanguage;
                    readingData.progress = chapter.chapter;
                    await readingData.save();
                    return;
                }
            };
        }
    }
    async handleRead(mangaId, interaction, skipTryResume = false) {
        if (!mangaId) return interaction.followUp({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.`, ephemeral: true });

        if (!skipTryResume) {
            const tryResumeRead = await this.resumeReading({ mangaId }, interaction);
            if (tryResumeRead) return;
        };

        
        const manga = await MFA.Manga.get(mangaId).catch((err) => {
            this.client.logger.error(err);
            return null
        });
        if (!manga) return interaction.followUp({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.`, ephemeral: true });

        if (!skipTryResume) {
            const readingListData = await readingListDatabase.findOneAndUpdate({
                mangaId: manga.id,
                userId: interaction.user.id
            }, {
                lastUpdated: Date.now()
            }, {
                new: true
            });
    
            if (readingListData?.progressChapterId) {
                return this.handleInitialRead({ chapterId: readingListData.progressChapterId }, manga, interaction);
            };
        }

        let chapters = await MFA.Manga.getFeed(mangaId, { limit: Infinity, order: {
            chapter: 'asc'
        }})
        .catch((err) => {
            this.client.logger.error(err);
            return null
        });

        if (!chapters) return interaction.followUp({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.`, ephemeral: true });

        if (!chapters.length) return interaction.followUp({ content: `This manga doesn't have any chapters avaliable yet.` });
        

        const listLangs = [...new Set(chapters.map((chapter) => chapter.translatedLanguage))];

        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Previous')
            .setCustomId("prevpagechapterbtn")
            .setEmoji('⬅️')
            .setStyle(2)
            .setDisabled(true),
            new ButtonBuilder()
            .setLabel('Jump to')
            .setCustomId('jumppagechapterbtn')
            .setEmoji('↗️')
            .setStyle(2),
            new ButtonBuilder()
            .setLabel('Next')
            .setCustomId("nextpagechapterbtn")
            .setEmoji('➡️')
            .setStyle(2),
            new ButtonBuilder()
            .setLabel('Read')
            .setCustomId("readchapterbtn")
            .setStyle(ButtonStyle.Success)
            .setEmoji('📖'),
            new ButtonBuilder()
            .setLabel('F.A.Q')
            .setCustomId("frequentquestionchapterchoosebtn")
            .setStyle(ButtonStyle.Success)
            .setEmoji('📜')
        ]);

        const row2 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selectlangmenuchapter')
                .setPlaceholder('Choose translated language')
                .setMaxValues(1)
                .setMinValues(1)
                .addOptions(listLangs.map((lang) => {
                    const fetchedLang = this.client.languageHandler.getName(lang, "en");
                    return {
                        label: fetchedLang ? fetchedLang : lang,
                        value: lang
                    }
                })),
        );

        const filteredChapters = new Map();

        listLangs.forEach((lang) => {
            const filtered = chapters.filter((chapter) => chapter.translatedLanguage === lang).sort((a, b) => Number(a.chapter) - Number(b.chapter));
            filtered.forEach((chapter, index) => {
                chapter.index = index;
            });
            filteredChapters.set(lang, filtered);
        });


        let chaptersList = [...filteredChapters.values()][0];


        let arrEmbeds;

        if (chaptersList.length > 10) {
            const fetchedChaptersList = chaptersList.map((chapter) => {
                return {
                    chapter: chapter.chapter || 0,
                    title: chapter.title,
                    isExternal : chapter.isExternal,
                    index: chapter.index,
                    externalUrl: chapter.externalUrl
                }
            });
            const arrSplitted = [];
            while (fetchedChaptersList.length) {
                const toAdd = fetchedChaptersList.splice(0, fetchedChaptersList.length >= 10 ? 10 : fetchedChaptersList.length);
                arrSplitted.push(toAdd);
            };

            arrEmbeds = arrSplitted.map((arr) => {
                const embed = new EmbedBuilder()
                .setColor("FF6740")
                .setURL(`https://mangadex.org/title/${manga.id}`)
                .setTitle(`${manga.title} - ${this.client.languageHandler.getName(chaptersList[0].translatedLanguage, "en") ? this.client.languageHandler.getName(chaptersList[0].translatedLanguage, "en") : chaptersList[0].translatedLanguage}`)
                .setDescription(arr.map((res) => {
                    return `**${res.index + 1}** • Chapter ${res.chapter}${res.title ? `: ${res.title}` : ''} ${res.isExternal ? `([External link](${res.externalUrl}))` : ''}`
                }).join("\n"));
                return embed;
            });
        } else {
            const fetchedChaptersList = chaptersList.map((chapter) => {
                return {
                    chapter: chapter.chapter || 0,
                    title: chapter.title,
                    isExternal : chapter.isExternal,
                    index: chapter.index,
                    externalUrl: chapter.externalUrl
                }
            });
            arrEmbeds = [new EmbedBuilder()
                .setColor("FF6740")
                .setURL(`https://mangadex.org/title/${manga.id}`)
                .setTitle(`${manga.title} - ${this.client.languageHandler.getName(chaptersList[0].translatedLanguage, "en") ? this.client.languageHandler.getName(chaptersList[0].translatedLanguage, "en") : chaptersList[0].translatedLanguage}`)
                .setDescription(fetchedChaptersList.map((res) => {
                    return `**${res.index + 1}** • Chapter ${res.chapter}${res.title ? `: ${res.title}` : ''} ${res.isExternal ? `([External link](${res.externalUrl}))` : ''}`
                }).join("\n"))]
        };

        let currentPage = 0;

        if (arrEmbeds.length === 1) {
            row.components[0].setDisabled(true);
            row.components[2].setDisabled(true);
        }

        const msg = await interaction.editReply({
            embeds: [arrEmbeds[currentPage]],
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

        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000
        });

        let endValue;

        collector.on('collect', async(res) => {
            switch (res.customId) {
                case 'frequentquestionchapterchoosebtn':
                    const embed = new EmbedBuilder()
                    .setTitle('Frequently asked questions')
                    .setColor('#BA8474')
                    .setDescription(`
                    **Q: Why are some chapter only avaliable through external links?**
                
                    A: Due to copyright issue, some chapters are only avaliable through external links.
                
                    **Q: I don't understand some languages!**
                
                    A: Due to the inconsistency of the language code type avaliable through the API, I might not understand some languages and therefore only showing you the language code. (this will be fixed in a future update)
                    `);
                    
                    res.reply({ embeds: [embed], ephemeral: true })
                    break;
                case 'selectlangmenuchapter':
                    await res.deferUpdate();
                    const selectedLang = res.values[0];
                    if (!selectedLang) {
                        res.followUp({
                            content: `You didn't select any language, please try again.`,
                            ephemeral: true
                        });
                    } else {
                        const newChaptersList = filteredChapters.get(selectedLang);
                        let newArrEmbeds;
                        if (newChaptersList.length > 10) {
                            const fetchedChaptersList = newChaptersList.map((chapter) => {
                                return {
                                    chapter: chapter.chapter || 0,
                                    title: chapter.title,
                                    isExternal : chapter.isExternal,
                                    index: chapter.index,
                                    externalUrl: chapter.externalUrl
                                }
                            });
                            const arrSplitted = [];
                            while (fetchedChaptersList.length) {
                                const toAdd = fetchedChaptersList.splice(0, fetchedChaptersList.length >= 10 ? 10 : fetchedChaptersList.length);
                                arrSplitted.push(toAdd);
                            };
                
                            newArrEmbeds = arrSplitted.map((arr) => {
                                const embed = new EmbedBuilder()
                                .setColor("FF6740")
                                .setURL(`https://mangadex.org/title/${manga.id}`)
                                .setTitle(`${manga.title} - ${this.client.languageHandler.getName(newChaptersList[0].translatedLanguage, "en") ? this.client.languageHandler.getName(newChaptersList[0].translatedLanguage, "en") : newChaptersList[0].translatedLanguage}`)
                                .setDescription(arr.map((res) => {
                                    return `**${res.index + 1}** • Chapter ${res.chapter}${res.title ? `: ${res.title}` : ''} ${res.isExternal ? `([External link](${res.externalUrl}))` : ''}`
                                }).join("\n"));
                                return embed;
                            });
                        } else {
                            const fetchedChaptersList = chaptersList.map((chapter) => {
                                return {
                                    chapter: chapter.chapter || 0,
                                    title: chapter.title,
                                    isExternal : chapter.isExternal,
                                    index: chapter.index,
                                    externalUrl: chapter.externalUrl
                                }
                            });
                            newArrEmbeds = [new EmbedBuilder()
                                .setColor("FF6740")
                                .setURL(`https://mangadex.org/title/${manga.id}`)
                                .setTitle(`${manga.title} - ${this.client.languageHandler.getName(newChaptersList[0].translatedLanguage, "en") ? this.client.languageHandler.getName(newChaptersList[0].translatedLanguage, "en") : newChaptersList[0].translatedLanguage}`)
                                .setDescription(fetchedChaptersList.map((res) => {
                                    return `**${res.index + 1}** • Chapter ${res.chapter}${res.title ? `: ${res.title}` : ''} ${res.isExternal ? `([External link](${res.externalUrl}))` : ''}`
                                }).join("\n"))]
                        };
                        row.components[0].setDisabled(true);
                        if (newArrEmbeds.length === 1) {
                            row.components[2].setDisabled(true);
                        } else {
                            row.components[2].setDisabled(false);
                        }
                        chaptersList = newChaptersList;
                        arrEmbeds = newArrEmbeds;
                        currentPage = 0;
                        res.editReply({
                            embeds: [newArrEmbeds[currentPage]],
                            content: `Page 1 of ${newArrEmbeds.length}`,
                            components: [row, row2]
                        })
                    }
                    break;
                case 'prevpagechapterbtn':
                    if (currentPage !== 0) {
                        --currentPage;
                        if (currentPage === 0) {
                            row.components[0].setDisabled(true);
                        } else {
                            row.components[0].setDisabled(false);
                        };
                        if (currentPage === arrEmbeds.length - 1) row.components[2].setDisabled(true);
                        else row.components[2].setDisabled(false);
                        res.update({
                            content: `Page ${currentPage + 1} of ${arrEmbeds.length}`,
                            embeds: [arrEmbeds[currentPage]],
                            components: [row, row2]
                        });
                    } else {
                        res.reply({
                            content: `You are already at the first page!`,
                            ephemeral: true
                        })
                    }
                    break;
                case 'nextpagechapterbtn':
                    if (currentPage < arrEmbeds.length - 1) {
                        currentPage++;
                        if (currentPage === arrEmbeds.length - 1) {
                            row.components[2].setDisabled(true);
                        } else {
                            row.components[2].setDisabled(false);
                        };
                        if (currentPage === 0) row.components[0].setDisabled(true);
                        else row.components[0].setDisabled(false);
                        res.update({
                            content: `Page ${currentPage + 1} of ${arrEmbeds.length}`,
                            embeds: [arrEmbeds[currentPage]],
                            components: [row, row2]
                        })
                    } else {
                        res.reply({
                            content: `You are already at the last page!`,
                            ephemeral: true
                        })
                    }
                    break;
                case 'jumppagechapterbtn':
                    const modal = new ModalBuilder()
                    .setCustomId('jumpingChapterList')
                    .setTitle('Navigating results');
                    const input = new TextInputBuilder()
                    .setMinLength(1)
                    .setRequired(true)
                    .setCustomId('numberJumpingChapterList')
                    .setLabel(`To what page would you like to jump?`)
                    .setPlaceholder(`1 - ${arrEmbeds.length}`)
                    .setStyle(TextInputStyle.Short);
                    const modalRow = new ActionRowBuilder().addComponents(input);
                    modal.addComponents(modalRow);
                    await res.showModal(modal);

                    const result = await res.awaitModalSubmit({
                        filter: (i) => {
                            if (i.customId !== 'jumpingChapterList' || i.user.id !== interaction.user.id) return false;
                            else if (isNaN(i.fields.getTextInputValue('numberJumpingChapterList'))  || Number(i.fields.getTextInputValue('numberJumpingChapterList')) > arrEmbeds.length || Number(i.fields.getTextInputValue('numberJumpingChapterList')) < 1) {
                                i.reply({
                                    content: `You should enter a vaild number \`1 - ${arrEmbeds.length}\` <:hutaoWHEEZE:1085918596955394180>`,
                                    ephemeral: true
                                })
                                return false
                            } else return true;
                        },
                        time: 15000
                    }).catch(() => null);
                    if (result) {
                        const number = result.fields.getTextInputValue('numberJumpingChapterList');
                        const pageNumber = Number(number);
                        currentPage = pageNumber - 1;
                        if (pageNumber === 1) row.components[0].setDisabled(true);
                        else row.components[0].setDisabled(false);
                        if (pageNumber === arrEmbeds.length) row.components[2].setDisabled(true);
                        else row.components[2].setDisabled(false);
                        result.update({
                            content: `Page ${number} of ${arrEmbeds.length}`,
                            embeds: [arrEmbeds[currentPage]],
                            components: [row, row2]
                        })
                    };
                    break;
                case 'readchapterbtn':
                    const modal1 = new ModalBuilder()
                    .setCustomId('infochapterlist')
                    .setTitle('Read a chapter');
                    const input1 = new TextInputBuilder()
                    .setMinLength(1)
                    .setRequired(true)
                    .setCustomId('chapterNumberReadingList')
                    .setLabel(`Which chapter would you like to read?`)
                    .setPlaceholder(`1 - ${chaptersList.length}`)
                    .setStyle(TextInputStyle.Short);
                    const modalRow1 = new ActionRowBuilder().addComponents(input1);
                    modal1.addComponents(modalRow1);
                    await res.showModal(modal1);

                    const mangaModalResult = await res.awaitModalSubmit({
                        filter: (i) => {
                            if (i.customId !== 'infochapterlist' || i.user.id !== interaction.user.id) return false;
                            else if (isNaN(i.fields.getTextInputValue('chapterNumberReadingList')) || Number(i.fields.getTextInputValue('chapterNumberReadingList')) > chaptersList.length || Number(i.fields.getTextInputValue('chapterNumberReadingList')) < 1) {
                                i.reply({
                                    content: `You should enter a vaild number \`1 - ${chaptersList.length}\` <:hutaoWHEEZE:1085918596955394180>`,
                                    ephemeral: true
                                })
                                return false
                            } else return true;
                        },
                        time: 15000
                    }).catch(() => null);
                    if (mangaModalResult) {
                        await mangaModalResult.deferUpdate();
                        const number = mangaModalResult.fields.getTextInputValue('chapterNumberReadingList');
                        endValue = { reason: 'showchapter', value: Number(number) };
                        collector.stop();
                    };
                    break;
            };

        });
        collector.on('end', async() => {
            if (endValue) {
                if (endValue.reason !== 'showinfo') return this.handleInitialRead({chapter: chaptersList[endValue.value - 1]}, manga, interaction);
            } else {
                row.components.forEach(button => button.setDisabled(true));
                row2.components.forEach(button => button.setDisabled(true));
                return interaction.editReply({
                    content: `Page ${currentPage + 1} of ${arrEmbeds.length}`,
                    components: [row, row2],
                    embeds: [arrEmbeds[currentPage]]
                });
            }

        })
    }
};
