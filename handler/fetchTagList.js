const axios = require('axios');

const baseUrl = 'https://api.mangadex.org';

let includedTagIDs, excludedTagIDs;

(async() => {
    const tags = await axios(`${baseUrl}/manga/tag`);\
    const genre = tags.data.data.filter(tag => tag.attributes.group === 'genre');
});