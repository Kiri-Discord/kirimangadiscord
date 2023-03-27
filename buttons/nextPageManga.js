const readingSessionDatabase = require('../database/readingSessions');
const { ActionRowBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const MFA = require("mangadex-full-api");
exports.run = async(client, interaction) => {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    await interaction.deferUpdate();

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
        interaction.followUp({ content: `That chapter isn't avaliable to read anymore <:Sapo:1078667608196391034> You can either skip to another chapter of this translation, or switch to another translation using below buttons!`, ephemeral: true });
        return;
    };
    if (fetchedChapter.error) {
        interaction.followUp({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${fetchedChapter.message}\``, ephemeral: true });
        return;
    };

    let uploader = await fetchedChapter.uploader.resolve();
    let resolvedGroups = await MFA.resolveArray(fetchedChapter.groups)
    let groupNames = resolvedGroups.map(elem => elem.name);

    let pages = await fetchedChapter.getReadablePages(true).catch(() => null);
    if (!pages || !pages.length) return interaction.followUp({ content: `An error occured when i go grab the pages. (likely not from your side) Please inform the developer about this.`, ephemeral : true });

    if (session.currentPage === pages.length) return interaction.followUp({ content: 'You are already at the last page <:hutaoWHEEZE:1085918596955394180>', ephemeral : true });

    const newPage = session.currentPage + 1;

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
    ]);

    const embed = new EmbedBuilder()
    .setDescription(`**Chapter ${currentChapter}: ${Boolean(fetchedChapter.title) ? fetchedChapter.title : 'Oneshot'}**`)
    .setFooter({ text: `Uploader: ${uploader ? uploader.username : 'Unknown'} | Translated by: ${groupNames.length ? groupNames.join(", ") : 'Unknown'}` })
    .setImage(pages[newPage -  1]);

    interaction.editReply({ embeds: [embed], components: [row, row1], content: `Page ${newPage} of ${pages.length} - <@${session.userId}>'s reading session` });

    session.currentPage = newPage;

    return session.save();
};

exports.info = {
    name: "nextpagereadbtn"
};