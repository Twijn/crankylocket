const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    guild: String,
    name: String,
    color: String,
    position: {
        type: Number,
        index: true,
    },
    assignable: {
        type: Boolean,
        default: true,
    },
    settings: {
        roleAdd: {
            type: Boolean,
            default: false,
        },
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("DiscordRole", schema);
