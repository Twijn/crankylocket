const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    code: {
        type: String,
        required: true,
    },
    link: String,
    platform: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
});

module.exports = mongoose.model("TwitchEmote", schema);
