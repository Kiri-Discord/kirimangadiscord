const readingListDatabase = require('../database/readingList');
const readingSessionDatabase = require('../database/readingSessions');

exports.run = async (client, interaction) => {
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
    if (session.userId === userId) {
        session.lastUpdated = Date.now();
        await session.save();
    }

    const { mangaId, currentChapter, translatedLanguage, mangaName, chapterId } = session;
    const fullNameLanguage = client.languageHandler.getName(translatedLanguage, "en") ? `(${client.languageHandler.getName(translatedLanguage, "en")})` : '';

    let readingListData = await readingListDatabase.findOneAndUpdate({
        mangaId,
        userId
    }, {
        mangaId,
        userId,
        lastUpdated: Date.now()
    }, {
        new: true
    });
    if (!readingListData) readingListData = new readingListDatabase({
        mangaId,
        userId,
    });

    if (readingListData.notification) {
        readingListData.notification = false;
        await readingListData.save();

        return interaction.followUp({ content: `🔕 I have disabled notification for **${mangaName}**. You won't receive any notification about new release in the future unless you re-enable notification.`, ephemeral: true });
    } else {
        if (!readingListData.notifyChapter || Number(readingListData.notifyChapter) < Number(currentChapter)) {
            readingListData.notifyChapter = currentChapter;
        }
        readingListData.progress = currentChapter;
        readingListData.progressChapterId = chapterId;
        readingListData.readingLanguage = translatedLanguage;
        readingListData.notification = true;

        await readingListData.save();
        return interaction.followUp({ content: `🔔 I will start notifying you about new update in **${mangaName}** ${fullNameLanguage}!`, ephemeral: true });
    };
}

exports.info = {
    name: "notifyreadingbtn"
}