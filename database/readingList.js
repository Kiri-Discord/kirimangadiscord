const mongoose = require("mongoose");

const reqString = {
    type: String,
    required: true,
};

const Schema = mongoose.Schema({
    mangaId: reqString,
    userId: reqString,
    progress: String,
    progressChapterId: String,
    readingLanguage: String,
    notifyChapter: String,
    notification: {
        type: Boolean,
        default: false,
    },
    lastUpdated: {
        type: Number,
        default: Date.now()
    }
});

module.exports = mongoose.model("readingList", Schema, "readingList");