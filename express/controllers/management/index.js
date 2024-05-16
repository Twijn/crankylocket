const express = require("express");
const router = express.Router();

const { TwitchToken, TwitchReward, DiscordRole, TwitchEmote } = require("../../../schemas");
const fetcher = require("../../../twitch/emotes");

const updateChannels = require("./updateChannels");
const updateEmotes = require("./updateEmotes");
const updateRedemptions = require("./updateRedemptions");
const updateRoles = require("./updateRoles");

router.get("/", async (req, res) => {
    const tokens = await TwitchToken.find({});
    const rawRewards = await TwitchReward.find({}).sort({cost: -1});
    const discordRoles = await DiscordRole.find({}).sort({position: -1});
    const emotes = await TwitchEmote.find({}).sort([
        ["code", 1],
        ["platform", 1],
    ]);

    let allEmotes = Array.from(fetcher.emotes.values());

    let emoteCount = 0;
    let emoteTime = 0;
    let maxPerUser = 0;
    let lastingTime = 0;

    if (emotes.length > 0) {
        emoteCount = emotes[0].requirements.emoteCount;
        emoteTime = emotes[0].requirements.emoteTime;
        maxPerUser = emotes[0].requirements.maxPerUser;
        lastingTime = emotes[0].requirements.lastingTime;
    }

    allEmotes = allEmotes.filter(x => !emotes.find(y => y._id === x.id));
    allEmotes.sort((a, b) => a.code - b.code);
    allEmotes.sort((a, b) => a.type - b.type);

    const rewards = [];

    rawRewards.forEach(reward => {
        const broadcasterRewards = rewards.find(x => x.broadcaster === reward.broadcaster);
        if (broadcasterRewards) {
            broadcasterRewards.rewards.push(reward);
        } else {
            const broadcaster = tokens.find(x => x.user === reward.broadcaster);
            if (!broadcaster) {
                return console.error("Missing broadcaster for " + reward.broadcaster);
            }
            rewards.push({
                broadcaster: reward.broadcaster,
                broadcasterName: broadcaster.userDisplayName,
                rewards: [reward],
            });
        }
    });

    let error = null;
    let info = null;

    if (req?.query?.error) {
        error = req.query.error;
    } else if (req?.query?.info) {
        info = req.query.info;
    }

    res.render("pages/index", {
        tokens,
        discordRoles,
        broadcasterRewards: rewards,
        emotes, allEmotes,
        emoteCount, emoteTime, maxPerUser, lastingTime,
        error, info,
    });
});

const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({extended: true}));

router.use("/channels", updateChannels);
router.use("/emotes", updateEmotes);
router.use("/redemptions", updateRedemptions);
router.use("/roles", updateRoles);

module.exports = router;
