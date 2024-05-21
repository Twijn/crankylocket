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
        wheelColor: {
            type: String,
            default: null,
        },
        wheelTextColor: {
            type: String,
            default: null,
        },
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

schema.methods.json = function() {
    return {
        id: this._id,
        name: this.name,
        color: this.color,
        wheelColor: this.settings.wheelColor ? this.settings.wheelColor : this.color,
        wheelTextColor: this.settings.wheelTextColor ? this.settings.wheelTextColor : "white",
    }
}

module.exports = mongoose.model("DiscordRole", schema);
