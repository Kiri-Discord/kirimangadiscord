const MFA = require('mangadex-full-api');

module.exports = class Manga {
    constructor(client, username, password) {
        this.instance = null;
        this.username = username;
        this.password = password;
    };
    async login() {
        const instance = await MFA.login(this.username, this.password, './bin/.md_cache').catch(err => {
            client.logger.error(err);
            return null
        });
        if (instance) {
            this.instance = instance;
            return instance;
        } else {
            return null
        }
    }
}