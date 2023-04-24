const { SlashCommandSubcommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, TextInputStyle, ModalBuilder, TextInputBuilder } = require('discord.js');
const iso = require('iso-639-1');
const axios = require('axios');
const { genre, theme, format } = require('../../assets/tagList.json');
const similarityChecker = require("string-similarity");
const { flag } = require('../../handler/countryToEmoji.js');
const { paginatedMangaSearch } = require('../../handler/Util.js');


exports.run = async(client, interaction, bridgedTitle) => {
    const title = bridgedTitle ? bridgedTitle : interaction.options.getString('title');
    const authorOrArtist = interaction.options.getString('author');
    const includedGenre = interaction.options.getString('included-genre');
    const includedTheme = interaction.options.getString('included-theme');
    const excludedGenre = interaction.options.getString('excluded-genre');
    const excludedTheme = interaction.options.getString('excluded-theme');
    const format = interaction.options.getString('format');
    const status = interaction.options.getString('status');
    const demographic = interaction.options.getString('demographic');
    const originalLanguage = interaction.options.getString('original-language');
    const translatedLanguage = interaction.options.getString('translated-language');
    const rating = interaction.options.getString('rating');

    if (!bridgedTitle) await interaction.deferReply();

    let options = {
        limit: 40,
    };
    if (title) options.title = title;
    if (authorOrArtist) options.authorOrArtist = authorOrArtist;
    if (status) options.status = [status];
    if (demographic) options.publicationDemographic = [demographic];
    if (rating) {
        if (rating === 'erotica') options.contentRating = ["safe","suggestive","erotica"];
        else if (rating === 'pornographic') options.contentRating = ["safe","suggestive","erotica", "pornographic"];
    } else options.contentRating = ["safe","suggestive"];

    if (translatedLanguage) {
        const lang = iso.getCode(translatedLanguage.toLowerCase());
        if (!iso.validate(lang)) {
            interaction.editReply({ content: `The language you have entered (\`${translatedLanguage}\`) is invalid. Please check your spelling and try again <:hutaoWHEEZE:1085918596955394180> (You should choose one of those recommended tag suggestion as you type because they are avaliable.)`, ephemeral: true });
            return;
        };
        options.availableTranslatedLanguage = [lang];
    };

    if (originalLanguage) {
        const lang = iso.getCode(originalLanguage.toLowerCase());
        if (!iso.validate(lang)) {
            interaction.editReply({ content: `The language you have entered (\`${originalLanguage}\`) is invalid. Please check your spelling and try again <:hutaoWHEEZE:1085918596955394180> (You should choose one of those recommended tag suggestion as you type because they are avaliable.)`, ephemeral: true });
            return;
        };
        options.originalLanguage = [lang];
    };



    if (includedGenre || includedTheme || excludedGenre || excludedTheme || format) {
        const tags = await axios(`https://api.mangadex.org/manga/tag`).catch(err => {
            client.logger.error(err);
            interaction.editReply({ content: 'You provided me with some tags to include or exclude, but there was a problem when I try to verify it with MangaDex server <:Sapo:1078667608196391034>. You can either remove them to search right away, or wait for a few minutes.', ephemeral: true });
            return null;
        });

        if (!tags) return;
        const mangaFormatID = tags.data.data.find(tag => format === tag.attributes.name.en);
        const includedGenreID = tags.data.data.find(tag => includedGenre === tag.attributes.name.en);
        const excludedGenreID = tags.data.data.find(tag => excludedGenre === tag.attributes.name.en);
        const includedThemeID = tags.data.data.find(tag => includedTheme === tag.attributes.name.en);
        const excludedThemeID = tags.data.data.find(tag => excludedTheme === tag.attributes.name.en);

        if ((!mangaFormatID && format) || (!includedGenreID && includedGenre) || (!excludedGenreID && excludedGenre) || (!includedThemeID && includedTheme) || (!excludedThemeID && excludedTheme)) {
            interaction.editReply({ content: 'Some of your tags are invalid <:hutaoWHEEZE:1085918596955394180>. You should choose one of those recommended tag suggestion as you type because they are avaliable. The tag you have typed, might not. (tags are case-sensitive)', ephemeral: true });
            return;
        };

        const includedTags = [];
        const excludedTags = [];

        if (mangaFormatID) includedTags.push(mangaFormatID.id);
        if (includedGenreID) includedTags.push(includedGenreID.id);
        if (includedThemeID) includedTags.push(includedThemeID.id);
        if (excludedGenreID) excludedTags.push(excludedGenreID.id);
        if (excludedThemeID) excludedTags.push(excludedThemeID.id);

        options.includedTags = includedTags;
        options.excludedTags = excludedTags;
    };

    const results = await client.manga.search(options);
    if (results.error) {
        interaction.editReply({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${results.message}\``, ephemeral: true });
        return;
    };

    if (results.length === 0) {
        return interaction.editReply({ content: 'No results was found <:Sapo:1078667608196391034>' });
    };

    const resultFiltered = results.map((res, index) => {
        return {
            title: res.title,
            originalLanguage: res.originalLanguage,
            status: res.status,
            id: res.id,
            index: index + 1
        }
    })


    if (results.length > 10) {
        const resLength = results.length;
        const arrSplitted = [];
        while (resultFiltered.length) {
            const toAdd = resultFiltered.splice(0, resultFiltered.length >= 10 ? 10 : resultFiltered.length);
            arrSplitted.push(toAdd);
        };
        const arrEmbeds = arrSplitted.map((arr, index) => {
            const embed = new EmbedBuilder()
            .setThumbnail('https://i.imgur.com/uMW1HWw.png')
            .setColor('FF6740')
            .setTitle(`Found ${resLength} ${resLength === 1 ? 'result' : 'results'}`)
            .setDescription(arr.map((res) => {
                let countryFlag
                if (!res.originalLanguage) countryFlag = '';
                else {
                    const fullName = client.languageHandler.getName(res.originalLanguage, "en")
                    // const fullName = iso.getName(res.originalLanguage);
                    const emojiFlag = flag(fullName);
                    if (emojiFlag) countryFlag = emojiFlag;
                    else countryFlag = `\`${res.originalLanguage}\``;
                }
                return `**${res.index}** • ${countryFlag} ${res.title} **(${res.status})**`
            }).join("\n"));
            return embed;
        });
        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Previous')
            .setCustomId("previousbtn")
            .setEmoji('⬅️')
            .setStyle(2)
            .setDisabled(true),
            new ButtonBuilder()
            .setLabel('Jump to')
            .setCustomId('jumpbtn')
            .setEmoji('↗️')
            .setStyle(2),
            new ButtonBuilder()
            .setLabel('Next')
            .setCustomId("nextbtn")
            .setEmoji('➡️')
            .setStyle(2)
        ]);
        const row2 = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Show more info')
            .setCustomId("showinfobtn")
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔎')
        ]);
    
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
        const result = await paginatedMangaSearch(interaction, arrEmbeds, msg, [row, row2], filter, interaction.user.id, resLength);
        if (result.reason !== 'time') {
            const targetManga = results[result.value - 1];
            const commandFile = client.commands.get('manga');
            const command = commandFile.subCommandsGroup.get('info');
            return command.run(client, interaction, { bridgedManga: targetManga, bridgedTitle: title });
        }
    } else {
        const embed = new EmbedBuilder()
        .setThumbnail('https://i.imgur.com/uMW1HWw.png')
        .setColor('FF6740')
        .setTitle(`Found ${results.length} ${results.length === 1 ? 'result' : 'results'}`)
        .setDescription(results.map((res, index) => {
            let countryFlag
            if (!res.originalLanguage) countryFlag = '';
            else countryFlag = Boolean(flag(client.languageHandler.getName(res.originalLanguage, "en"))) ? flag(client.languageHandler.getName(res.originalLanguage, "en")) : `\`${res.originalLanguage}\``;
            return `**${index + 1}** • ${countryFlag} ${res.title} **(${res.status})**`
        }).join("\n"));
        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Show more info')
            .setCustomId("showinfobtn")
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔎')
        ]);

        const filter = async res => {
            if (res.customId !== 'showinfobtn') return false;
            if (res.user.id !== interaction.user.id) {
                res.reply({
                    content: `This button are for ${interaction.user.toString()} <:hutaoWHEEZE:1085918596955394180>`,
                    ephemeral: true
                });
                return false;
            } else return true
        };


        const msg = await interaction.editReply({ embeds: [embed], fetchReply: true, components: [row] });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter,
            time: 60000
        });

        collector.on('collect', async(res) => {
            const modal1 = new ModalBuilder()
            .setCustomId('info')
            .setTitle('Display manga info');
            const input1 = new TextInputBuilder()
            .setMinLength(1)
            .setRequired(true)
            .setCustomId('mangaNumber')
            .setLabel(`Which manga would you like to show more info?`)
            .setPlaceholder(`1 - ${results.length}`)
            .setStyle(TextInputStyle.Short);
            const row1 = new ActionRowBuilder().addComponents(input1);
            modal1.addComponents(row1);
            await res.showModal(modal1);

            const mangaModalResult = await res.awaitModalSubmit({
                filter: (i) => {
                    if (i.customId !== 'info' || i.user.id !== interaction.user.id) return false;
                    else if (isNaN(i.fields.getTextInputValue('mangaNumber')) || Number(i.fields.getTextInputValue('mangaNumber')) > results.length || Number(i.fields.getTextInputValue('mangaNumber')) < 1) {
                        i.reply({
                            content: `You should enter a vaild number \`1 - ${results.length}\` <:hutaoWHEEZE:1085918596955394180>`,
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
                const number = mangaModalResult.fields.getTextInputValue('mangaNumber');
                const targetManga = results[Number(number) - 1];
                const commandFile = client.commands.get('manga');
                const command = commandFile.subCommandsGroup.get('info');
                return command.run(client, interaction, { bridgedManga: targetManga, bridgedTitle: title });
            }
        });
        collector.on('end', async(collection, reason) => {
            if (reason !== 'time') return;
            else {
                row.components.forEach(button => button.setDisabled(true));
                interaction.editReply({
                    components: [row]
                });
            };
        })
    }
};

exports.autocomplete = async(client, interaction) => {
    const { value, name } = interaction.options.getFocused(true);
    if (!value) return interaction.respond([]);
    if (name === 'included-genre' || name === 'excluded-genre') {
        const matches = similarityChecker.findBestMatch(value, genre);
        const sorted = matches.ratings.sort((a, b) => b.rating - a.rating).splice(0, 10);
        return interaction.respond(sorted.map(res => ({ name: res.target, value: res.target })));
    } else if (name === 'included-theme' || name === 'excluded-theme') {
        const matches = similarityChecker.findBestMatch(value, theme);
        const sorted = matches.ratings.sort((a, b) => b.rating - a.rating).splice(0, 10);
        return interaction.respond(sorted.map(res => ({ name: res.target, value: res.target })));
    } else if (name === 'format') {
        const matches = similarityChecker.findBestMatch(value, format);
        const sorted = matches.ratings.sort((a, b) => b.rating - a.rating).splice(0, 10);
        return interaction.respond(sorted.map(res => ({ name: res.target, value: res.target })));
    } else if (name === 'original-language' || name === 'translated-language') {
        const listLangs = iso.getAllNames();
        const matches = similarityChecker.findBestMatch(value, listLangs);
        const sorted = matches.ratings.sort((a, b) => b.rating - a.rating).splice(0, 10);
        return interaction.respond(sorted.map(res => ({ name: res.target, value: res.target })));
    }
}

exports.info = {
    name: 'search',
    slash: new SlashCommandSubcommandBuilder()
        .setName('search')
        .setDescription('Search for manga on MangaDex. Additional inclusion/exclusion tags can be applied.')
        .addStringOption(option => option.setName('title').setDescription('The title of the manga to search for.'))
        .addStringOption(option => option.setName('author').setDescription('The name of the author or artist of the manga to search for.'))
        .addStringOption(option => option.setName('included-genre').setDescription('The genre of the manga to include in the search result.').setAutocomplete(true))
        .addStringOption(option => option.setName('included-theme').setDescription('The theme of the manga to include in the search result.').setAutocomplete(true))
        .addStringOption(option => option.setName('excluded-genre').setDescription('The genre of the manga to exclude from the search result.').setAutocomplete(true))
        .addStringOption(option => option.setName('excluded-theme').setDescription('The theme of the manga to exclude from the search result.').setAutocomplete(true))
        .addStringOption(option => option.setName('original-language').setDescription('Filter mangas that has were written in this language.').setAutocomplete(true))
        .addStringOption(option => option.setName('translated-language').setDescription('Filter mangas that were translated to this language.').setAutocomplete(true))
        .addStringOption(option => option.setName('format').setDescription('The format of the manga to filter.').setAutocomplete(true))
        .addStringOption(option => option.setName('status').setDescription('The status of the manga.').addChoices({
            "name": "Completed",
            "value": "completed"
        }, {
            "name": "Ongoing",
            "value": "ongoing"
        }, {
            "name": "Hiatus",
            "value": "hiatus"
        }, {
            "name": "Cancelled",
            "value": "cancelled"
        }))
        .addStringOption(option => option.setName('demographic').setDescription('The demographic of the manga.').setChoices({
            "name": "Shounen",
            "value": "shounen"
        }, {
            "name": "Shoujo",
            "value": "shoujo"
        }, {
            "name": "Josei",
            "value": "josei"
        }, {
            "name": "Seinen",
            "value": "seinen"
        }))
        .addStringOption(option => option.setName('rating').setDescription('Option to include manga with explicit content').addChoices({
            "name": "Erotica",
            "value": "erotica"
        }, {
            "name": "Erotica and Pornographic",
            "value": "pornographic"
        }))
}