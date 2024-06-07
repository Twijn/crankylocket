const mongoose = require("mongoose");

const Setting = require("./Setting");

const DiscordRole = require("./DiscordRole");

const TwitchEmote = require("./TwitchEmote");
const TwitchReward = require("./TwitchReward");
const TwitchToken = require("./TwitchToken");

const WispReaction = require("./WispReaction");

const schemas = {
    Setting,
    
    DiscordRole,
    
    TwitchEmote,
    TwitchReward,
    TwitchToken,

    WispReaction,
}

mongoose.connect(process.env.MDB_URL).then(() => {
    console.log("Connected to MongoDB!");
}, console.error);

module.exports = schemas;
