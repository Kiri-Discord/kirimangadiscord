const MFA = require('mangadex-full-api');

module.exports = class Manga {
    constructor(client) {
        this.client = client;
    };
    async search(options) {
        if (!options) return {
            error: true,
            message: 'No options provided.'
        };
        const results = await MFA.Manga.search(options, true).catch((err) => {
            this.client.logger.error(err);
            return {
                error: true,
                message: err.message
            }
        });
        return results;
    };
}