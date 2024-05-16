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
    requirements: {
        emoteCount: {
            type: Number,
            default: 3,
        },
        emoteTime: {
            type: Number,
            default: 10,
        },
        maxPerUser: {
            type: Number,
            default: 2,
        },
        lastingTime: {
            type: Number,
            default: 10,
        },
    }
});

module.exports = mongoose.model("TwitchEmote", schema);
