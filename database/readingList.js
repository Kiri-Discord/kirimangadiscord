const mongoose = require("mongoose");

const reqString = {
    type: String,
    required: true,
};

const Schema = mongoose.Schema({
    mangaId: reqString,
    userId: reqString,
    progress: String,
    readingLanguage: String,
});

module.exports = mongoose.model("readingList", Schema, "readingList");
