const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    user: {
        type: String,
        index: true,
    },
    userDisplayName: String,
    tokenData: {
        accessToken: {
            type: String,
            required: true,
        },
        expiresIn: Number,
        obtainmentTimestamp: Number,
        refreshToken: String,
        scope: [String],
    },
    settings: {
        authorized: {
            type: Boolean,
            default: false,
        },
        useAsBot: {
            type: Boolean,
            default: false,
        },
        useAsChannel: {
            type: Boolean,
            default: false,
        },
    },
    emotes: {
        bttv: {
            type: Boolean,
            default: true,
        },
        ffz: {
            type: Boolean,
            default: true,
        },
        seventv: {
            type: Boolean,
            default: true,
        },
        twitch: {
            type: Boolean,
            default: true,
        },
    },
});

module.exports = mongoose.model("TwitchToken", schema);
