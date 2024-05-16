const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    _id: String,
    title: String,
    backgroundColor: String,
    broadcaster: String,
    cost: Number,
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    settings: {
        roleAdd: {
            type: Boolean,
            default: false,
        }
    },
});

module.exports = mongoose.model("TwitchReward", schema);
