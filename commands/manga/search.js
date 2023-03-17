const { SlashCommandSubcommandBuilder } = require('discord.js');
const iso = require('iso-639-1');
const axios = require('axios');
const { genre, theme, format } = require('../../assets/tagList.json');
const similarityChecker = require("string-similarity");

exports.run = async(client, interaction) => {
    const title = interaction.options.getString('title');
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

    await interaction.deferReply();

    let options = {
        limit: 20,
    };
    if (title) options.title = title;
    if (authorOrArtist) options.authorOrArtist = authorOrArtist;
    if (status) options.status = [status];
    if (demographic) options.publicationDemographic = [demographic];

    if (translatedLanguage) {
        const lang = iso.getCode(translatedLanguage.toLowerCase());
        if (!iso.validate(lang)) {
            interaction.editReply({ content: `The language you have entered (\`${translatedLanguage}\`) is invalid. Please check your spelling and try again <:Sapo:1078667608196391034>`, ephemeral: true });
            return;
        };
        options.availableTranslatedLanguage = [lang];
    };

    if (originalLanguage) {
        const lang = iso.getCode(originalLanguage.toLowerCase());
        if (!iso.validate(lang)) {
            interaction.editReply({ content: `The language you have entered (\`${originalLanguage}\`) is invalid. Please check your spelling and try again <:Sapo:1078667608196391034>`, ephemeral: true });
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
    interaction.editReply({ content: `Found ${results.length} results.\nResults: ${results.map(res => res.title).join("\n")}`, ephemeral: true });
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
    };
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
}