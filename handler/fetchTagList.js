const axios = require('axios');
const fs = require('fs');

const baseUrl = 'https://api.mangadex.org';

(async() => {
    const tags = await axios(`${baseUrl}/manga/tag`);
    const genre = tags.data.data.filter(tag => tag.attributes.group === 'genre');
    const theme = tags.data.data.filter(tag => tag.attributes.group === 'theme');
    const format = tags.data.data.filter(tag => tag.attributes.group === 'format');

    const genreList = genre.map(tag => tag.attributes.name.en);
    const themeList = theme.map(tag => tag.attributes.name.en);
    const formatList = format.map(tag => tag.attributes.name.en);

    const tagList = {
        genre: genre.map(tag => tag.attributes.name.en),
        theme: theme.map(tag => tag.attributes.name.en),
        format: format.map(tag => tag.attributes.name.en)
    };
    const parsed = JSON.stringify(tagList, null, 4);
    fs.writeFileSync(`${process.cwd()}/assets/tagList.json`, parsed);

})();