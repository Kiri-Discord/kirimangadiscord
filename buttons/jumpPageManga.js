const readingSessionDatabase = require("../database/readingSessions");
const {
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    ButtonBuilder,
    TextInputStyle,
    TextInputBuilder,
    ButtonStyle
} = require("discord.js");
const MFA = require("mangadex-full-api");

exports.run = async (client, interaction) => {
    const { id: messageId, content: messageContent } = interaction.message;
    const userId = interaction.user.id;
    
    const maxPages = Number(messageContent.match(/Page\s+[0-9]+\s+of\s+[0-9]+/i)[0].split(" ")[3])

    const modal = new ModalBuilder()
        .setCustomId("jumpReadingModal")
        .setTitle("Jump to page");

    const input = new TextInputBuilder()
        .setMinLength(1)
        .setRequired(true)
        .setCustomId("jumpingNumberReadingInput")
        .setLabel(`To what page would you like to jump?`)
        .setPlaceholder(`1 - ${maxPages}`)
        .setStyle(TextInputStyle.Short);

    const modalRow = new ActionRowBuilder().addComponents(input);

    modal.addComponents(modalRow);

    await interaction.showModal(modal);

    const result = await interaction.awaitModalSubmit({
            filter: (i) => {
                const inputPage = Number(i.fields.getTextInputValue("jumpingNumberReadingInput"))
                if (i.customId !== "jumpReadingModal" || i.user.id !== interaction.user.id) return false;
                else if (isNaN(inputPage) || inputPage > maxPages || inputPage < 1) {
                    i.reply({
                        content: `You should enter a vaild number \`1 - ${maxPages}\` <:hutaoWHEEZE:1085918596955394180>`,
                        ephemeral: true,
                    });
                    return false;
                } else return true;
            },
            time: 15000,
        })
        .catch(() => null);

    if (result) {
        await result.deferUpdate();
        const targetPage = Number(result.fields.getTextInputValue("jumpingNumberReadingInput"))
        const session = await readingSessionDatabase.findOne({
            messageId
        });

        if (!session)
            return interaction.followUp({
                content:
                    "This session is no longer avaliable to interact with <:Sapo:1078667608196391034>",
                ephemeral: true,
            });
        if (!session.share && session.userId !== userId)
        return interaction.followUp({
            content:
                "This session is locked and only accessible by its owner only. Other users can interact once the owner of this session share it using \`/session share\`!",
            ephemeral: true,
        });
        

        const { chapterId, currentChapter } = session;

        const fetchedChapter = await client.manga.getChapter(chapterId);
        if (fetchedChapter.message === "No results found.") {
            interaction.followUp({
                content: `That chapter isn't avaliable to read anymore <:Sapo:1078667608196391034> You can either skip to another chapter of this translation, or switch to another translation using below buttons!`,
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

        let uploader = await fetchedChapter.uploader.resolve();
        let resolvedGroups = await MFA.resolveArray(fetchedChapter.groups)
        let groupNames = resolvedGroups.map(elem => elem.name);

        let pages = await fetchedChapter
            .getReadablePages(true)
            .catch(() => null);
        if (!pages || !pages.length)
            return interaction.followUp({
                content: `An error occured when i go grab the pages. (likely not from your side) Please inform the developer about this.`,
                ephemeral: true,
            });
        let newPage;
        let warning = false;
        if (maxPages !== pages.length) {
            newPage = 1;
            warning = true;
        } else {
            newPage = targetPage;
        };
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
            .setEmoji('🔔'),
        ]);

        const embed = new EmbedBuilder()
            .setDescription(
                `**Chapter ${currentChapter}${Boolean(fetchedChapter.title) ? `: ${fetchedChapter.title}` : ''}**`
            )
            .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` })
            .setImage(pages[newPage - 1]);

        await interaction.editReply({
            embeds: [embed],
            components: [row, row1],
            content: `Page ${newPage} of ${pages.length} - <@${session.userId}>'s reading session`,
        });

        if (warning) {
            await interaction.followUp({
                content: `The number of pages in this chapter has changed since you started reading it. You have been redirected to the first page. <:Sapo:1078667608196391034>`,
                ephemeral: true,
            });
        };

        session.currentPage = newPage;
        session.lastUpdated = Date.now();

        return session.save();
    };
};

exports.info = {
    name: "jumppagereadbtn",
};
