const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    wheelCss: {
        type: String,
        default: "right:2em;bottom:2em;",
    },
    reactionCss: {
        type: String,
        default: "left:2em;bottom:2em;",
    },
    reactionSetting: {
        type: String,
        default: "wisp",
        enum: ["wisp", "emote"],
    },
    wheelSetting: {
        type: String,
        default: "block",
        enum: ["block", "remove", "ignore"],
    },
    emoteRequirements: {
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
        }
    }
});

module.exports = mongoose.model("Setting", schema);
