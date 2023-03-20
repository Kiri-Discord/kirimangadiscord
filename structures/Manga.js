const MFA = require("mangadex-full-api");

module.exports = class Manga {
    constructor(client) {
        this.client = client;
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
    }
    async handleRead(mangaId) {
        if (!mangaId)
            return {
                error: true,
                message: "No manga ID was provided. (internal)",
            };
        const manga = await MFA.Manga.get(mangaId).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message,
            };
        });
        let chapters = await manga.getFeed({ order: {
            volume: 'asc',
            chapter: 'asc'
        }, includeEmptyPages: 0 }, true);
        console.log({
            chaptersList: chapters.map((chapter) => chapter.chapter),
            translatedLanguages: chapters.map((chapter) => chapter.translatedLanguage),
        });
    }
};
