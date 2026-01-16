const express = require("express");
const router = express.Router();

const { TwitchToken, TwitchReward, DiscordRole, TwitchEmote, WispReaction, RoleWheelRedemption } = require("../../../schemas");
const utils = require("../../../utils");
const fetcher = require("../../../twitch/emotes");
const ws = require("../../ws");
const pkg = require("../../../package.json");

const updateChannels = require("./updateChannels");
const updateEmotes = require("./updateEmotes");
const updateRewards = require("./updateRewards");
const updateRoles = require("./updateRoles");
const updateSettings = require("./updateSettings");
const spinWheel = require("./spinWheel");

// Helper function to get query params
const getQueryParams = (req) => {
    let error = null;
    let info = null;
    if (req?.query?.error) {
        error = req.query.error;
    } else if (req?.query?.info) {
        info = req.query.info;
    }
    return { error, info };
};

// Dashboard - Site status, chat activity stats
router.get("/", async (req, res) => {
    const wispStats = await WispReaction.getStats();
    const roleWheelStats = await RoleWheelRedemption.getStats();
    const wsStats = ws.getStats();

    const { error, info } = getQueryParams(req);

    res.render("pages/dashboard", {
        wispStats,
        roleWheelStats,
        wsStats,
        appVersion: pkg.version,
        error, info,
    });
});

// Rewards page
router.get("/rewards", async (req, res) => {
    const tokens = await TwitchToken.find({});
    const rawRewards = await TwitchReward.find({}).sort({cost: -1});
    
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

    const { error, info } = getQueryParams(req);

    res.render("pages/rewards", {
        broadcasterRewards: rewards,
        error, info,
        restart: req.query.restart === "",
    });
});

// Roles page
router.get("/roles", async (req, res) => {
    const discordRoles = await DiscordRole.find({}).sort({position: -1});
    const { error, info } = getQueryParams(req);
    
    // Get bot username for the info alert
    const discordClient = require("../../../discord");
    const botName = discordClient.user?.username || "the bot";

    res.render("pages/roles", {
        discordRoles,
        botName,
        error, info,
    });
});

// Users page
router.get("/users", async (req, res) => {
    const tokens = await TwitchToken.find({});
    const { error, info } = getQueryParams(req);

    res.render("pages/users", {
        tokens,
        error, info,
        restart: req.query.restart === "",
    });
});

// Emotes page
router.get("/emotes", async (req, res) => {
    const emotes = await TwitchEmote.find({}).sort([
        ["code", 1],
        ["platform", 1],
    ]);

    let allEmotes = Array.from(fetcher.emotes.values());
    allEmotes = allEmotes.filter(x => !emotes.find(y => y._id === x.id));
    allEmotes.sort((a, b) => a.code - b.code);
    allEmotes.sort((a, b) => a.type - b.type);

    const { error, info } = getQueryParams(req);

    res.render("pages/emotes", {
        emotes, allEmotes,
        error, info,
    });
});

// Settings page
router.get("/settings", async (req, res) => {
    const settings = await utils.settings.get();
    const { error, info } = getQueryParams(req);

    const emoteCount = settings.emoteRequirements.emoteCount;
    const emoteTime = settings.emoteRequirements.emoteTime;
    const maxPerUser = settings.emoteRequirements.maxPerUser;
    const lastingTime = settings.emoteRequirements.lastingTime;

    res.render("pages/settings", {
        settings,
        emoteCount, emoteTime, maxPerUser, lastingTime,
        error, info,
        restart: req.query.restart === "",
    });
});

const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({extended: true}));

router.use("/channels", updateChannels);
router.use("/emotes", updateEmotes);
router.use("/rewards", updateRewards);
router.use("/roles", updateRoles);
router.use("/settings", updateSettings);
router.use("/spin-wheel", spinWheel);

// Refresh overlay - sends WS message to all clients to refresh
router.post("/refresh-overlay", async (req, res) => {
    const username = req.query.username || "an administrator";
    
    ws.broadcast({
        type: "refresh-overlay",
        username,
        message: `Refreshing overlay: settings updated by ${username}`,
    });
    
    res.redirect(req.get("Referer") || "/settings?info=Overlay refresh signal sent");
});

module.exports = router;
