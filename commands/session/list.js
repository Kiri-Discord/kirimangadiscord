const {
    SlashCommandSubcommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    ButtonStyle,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder
} = require("discord.js");
const { paginatedMangaSessionList } = require('../../handler/Util.js');

const readingSessionDatabase = require("../../database/readingSessions");

exports.run = async(client, interaction) => {
    await interaction.deferReply();
    const sessionData = await readingSessionDatabase.find({
        userId: interaction.user.id,
    });
    if (!sessionData.length) {
        return interaction.editReply({
            content: "You have no manga in your session list yet <:Sapo:1078667608196391034>. Search for mangas using `/manga search` or `/manga info` to read a manga",
            ephemeral: true,
        });
    };

    const sessions = sessionData.map((session, index) => {
        return {
            id: session.sessionId,
            name: session.mangaName,
            translatedLanguage: session.translatedLanguage,
            currentChapter: session.currentChapter,
            index
        }
    });
    const row2 = new ActionRowBuilder()
    .addComponents([
        new ButtonBuilder()
        .setLabel('Resume a session')
        .setCustomId("startreadingsessionlistbtn")
        .setStyle(ButtonStyle.Success)
        .setEmoji('📖'),
    ]);
    if (sessions.length > 10) {
        const resLength = sessions.length;
        const mangaChunks = [];
        while (sessions.length) {
            const toAdd = sessions.splice(0, sessions.length >= 10 ? 10 : sessions.length);
            mangaChunks.push(toAdd);
        };
        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setLabel('Previous')
            .setCustomId("previoussessionlistpagebtn")
            .setEmoji('⬅️')
            .setStyle(2)
            .setDisabled(true),
            new ButtonBuilder()
            .setLabel('Jump to')
            .setCustomId('jumpsessionlistpagebtn')
            .setEmoji('↗️')
            .setStyle(2),
            new ButtonBuilder()
            .setLabel('Next')
            .setCustomId("nextsessionlistpagebtn")
            .setEmoji('➡️')
            .setStyle(2)
        ]);
        const arrEmbeds = mangaChunks.map((arr, index) => {
            const embed = new EmbedBuilder()
            .setColor("FF6740")
            .setTitle("Your session list")
            .setDescription(arr.map((res) => {
                const countryFlag = client.languageHandler.getName(res.translatedLanguage, "en") ? client.languageHandler.getName(res.translatedLanguage, "en") : `\`${res.translatedLanguage}\``;
                return `**${res.index + 1}** • ID: ||\`${res.id}\`||\n<:arrow:1089855713922261042> **${res.name}**: At chapter ${res.currentChapter} (${countryFlag})`
            }).join("\n"));
            return embed;
        });
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
        const result = await paginatedMangaSessionList(interaction, arrEmbeds, msg, [row, row2], filter, interaction.user.id, resLength);
        if (result.reason !== 'time') {
            const targetSession = sessionData[result.value - 1];
            return client.manga.resumeReading({ sessionId: targetSession.sessionId }, interaction);
        }
    } else {
        const embed = new EmbedBuilder()
        .setColor("FF6740")
        .setTitle("Your session list")
        .setDescription(sessions.map((res) => {
            const countryFlag = client.languageHandler.getName(res.translatedLanguage, "en") ? client.languageHandler.getName(res.translatedLanguage, "en") : `\`${res.translatedLanguage}\``;
            return `**${res.index + 1}** • ID: ||\`${res.id}\`||\n<:arrow:1089855713922261042> **${res.name}**: At chapter ${res.currentChapter} (${countryFlag})`
        }).join("\n"));

        const msg = await interaction.editReply({ embeds: [embed], fetchReply: true, components: [row2] });

        const filter = async res => {
            if (res.customId !== 'startreadingsessionlistbtn') return;
            if (res.user.id !== interaction.user.id) {
                res.reply({
                    content: `Those buttons are for ${interaction.user.toString()} <:hutaoWHEEZE:1085918596955394180>`,
                    ephemeral: true
                });
                return false;
            } else return true
        };

        
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter,
            time: 60000
        });

        collector.on('collect', async(res) => {
            const modal1 = new ModalBuilder()
            .setCustomId('infosessionlist')
            .setTitle('Resuming a session');
            const input1 = new TextInputBuilder()
            .setMinLength(1)
            .setRequired(true)
            .setCustomId('mangaNumberSessionList')
            .setLabel(`Which session would you like to resume?`)
            .setPlaceholder(`1 - ${sessionData.length}`)
            .setStyle(TextInputStyle.Short);
            const row1 = new ActionRowBuilder().addComponents(input1);
            modal1.addComponents(row1);
            await res.showModal(modal1);

            const mangaModalResult = await res.awaitModalSubmit({
                filter: (i) => {
                    if (i.customId !== 'infosessionlist' || i.user.id !== interaction.user.id) return false;
                    else if (isNaN(i.fields.getTextInputValue('mangaNumberSessionList')) || Number(i.fields.getTextInputValue('mangaNumberSessionList')) > sessionData.length || Number(i.fields.getTextInputValue('mangaNumberSessionList')) < 1) {
                        i.reply({
                            content: `You should enter a vaild number \`1 - ${sessionData.length}\` <:hutaoWHEEZE:1085918596955394180>`,
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
                const number = mangaModalResult.fields.getTextInputValue('mangaNumberSessionList');
                const targetSession = sessionData[number - 1];
                return client.manga.resumeReading({ sessionId: targetSession.sessionId }, interaction);
            };
        });
        collector.on('end', async(collection, reason) => {
            if (reason !== 'time') return;
            else {
                row2.components.forEach(button => button.setDisabled(true));
                interaction.editReply({
                    components: [row2]
                });
            };
        })

    }
};

exports.info = {
    name: 'list',
    slash: new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('List all the manga session that you have')
}