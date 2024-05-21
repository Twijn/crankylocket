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
});

module.exports = mongoose.model("Setting", schema);
