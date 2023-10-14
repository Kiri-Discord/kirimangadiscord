const WebSocket = require("ws");
const retry = require("retry");
const {
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder
} = require("discord.js");

module.exports = {
    init: (client) => {
        const sendEmbed = async(data) => {
            if (data.type === 'chapterNotification') {
                const user = await client.users.fetch(data.userId).catch(() => null);
                if (!user) return;

                let embed;

                const manga = await client.manga.getManga(data.mangaId);

                if (!manga.error) {
                    embed = await client.manga.generateEmbedInfo(manga);
                };

                const array = [
                    new ButtonBuilder()
                    .setLabel(`Read this chapter`)
                    .setCustomId(`readfrom:${data.chapterId}`)
                    .setEmoji('📖')
                    .setStyle(ButtonStyle.Success)
                ]
                if (data.currentChapter && data.currentChapterId) array.unshift(new ButtonBuilder().setCustomId(`readfrom:${data.currentChapterId}`).setLabel(`Resume (Chapter ${data.currentChapter})`).setEmoji('🔖').setStyle(ButtonStyle.Success));
                const row = new ActionRowBuilder().addComponents(array);

                const fullNameLanguage = client.languageHandler.getName(data.language, "en") ? `(${client.languageHandler.getName(data.language, "en")})` : '';
                return user.send({ content: `**${data.mangaName}** from your reading list has an update! Chapter ${data.chapter} ${fullNameLanguage}`, embeds: [embed], components: [row] }).catch(() => null);
            }
        }
        const retryConnect = (errFunction) => {
            const operation = retry.operation({
                retries: 30,
                factor: 3,
                minTimeout: 1 * 1000,
                maxTimeout: 60 * 1000,
                randomize: true,
            });
            operation.attempt((currentAttempt) => {
                const ws = new WebSocket(process.env.WSURL, {
                    headers: {
                        Authorization: "Bearer " + process.env.WSTOKEN,
                    },
                });
        
                ws.on("open", () => {
                    client.logger.info("[WEBSOCKET] Connected to WebSocket!");
                })
                ws.on("error", (e) => {
                    client.logger.error(
                        `[WEBSOCKET] Socket encountered error (${e.message})`
                    );
                    ws.close();
                })
                ws.onclose = (event) => {
    
                    const errorMessage = `[WEBSOCKET] WebSocket closed with code ${event.code} and reason ${event.reason}.`;
                    const err = new Error(errorMessage);
                    if (operation.retry(err)) {
                        return client.logger.info(err.message + ' - Retrying attempt ' + currentAttempt)
                    } else {
                        return errFunction(err);
                    }
                };
                ws.onmessage = async(e) => {
                    const data = JSON.parse(e.data);
                    if (data.ping) return ws.send('hi')
                    else sendEmbed(data);
                };
            })
        }
        const wsConnection = new WebSocket(process.env.WSURL, {
            headers: {
                Authorization: "Bearer " + process.env.WSTOKEN,
            },
        });

        wsConnection.on("open", () => {
            client.logger.info("[WEBSOCKET] Connected to WebSocket!");
        })
        wsConnection.on("error", (e) => {
            client.logger.error(
                `[WEBSOCKET] Socket encountered error (${e.message})`
            );
            wsConnection.close();
        });

        wsConnection.onclose = (event) => {
            
            client.logger.info(
                `[WEBSOCKET] WebSocket closed with code ${event.code} and reason ${event.reason}. Initiating reconnecting procedure...`
            );

            return retryConnect((err) => {
                client.logger.info(
                    `[WEBSOCKET] WebSocket finally closed with reason ${err.message}`
                );
            })
        };

        wsConnection.onmessage = async(e) => {
            const data = JSON.parse(e.data);
            if (data.ping) return wsConnection.send('hi')
            else sendEmbed(data);
        };
    },
};
