const mongoose = require("mongoose")

const DiscordRole = require("./DiscordRole");

const TwitchEmote = require("./TwitchEmote");
const TwitchReward = require("./TwitchReward");
const TwitchToken = require("./TwitchToken");

const schemas = {
    DiscordRole,
    
    TwitchEmote,
    TwitchReward,
    TwitchToken,
}

mongoose.connect(process.env.MDB_URL).then(() => {
    console.log("Connected to MongoDB!");
}, console.error);

module.exports = schemas;