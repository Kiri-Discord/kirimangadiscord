const mongoose = require("mongoose");

const reqString = {
    type: String,
    required: true,
};

const reqNumber = {
    type: Number,
    required: true,
};

const Schema = mongoose.Schema({
    translatedLanguage: reqString,
    chapterId: reqString,
    messageId: reqString,
    mangaId: reqString,
    mangaName: reqString,
    userId: reqString,
    sessionId: reqString,
    currentChapter: reqString,
    currentPage: reqNumber,
    share: {
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model("readingSessions", Schema, "readingSessions");
