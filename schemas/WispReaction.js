const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    emoteId: {
        type: String,
        required: true,
    },
    emoteCode: {
        type: String,
        required: true,
    },
    reactions: {
        type: Number,
        required: true,
        index: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("WispReaction", schema);
