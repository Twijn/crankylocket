const express = require("express");
const router = express.Router();

const fetcher = require("../../../twitch/emotes");
const {TwitchEmote} = require("../../../schemas");
const utils = require("../../../utils");

router.post("/", async (req, res) => {
    const data = req?.body;
    if (!data?.enabled) {
        data.enabled = {};
    }
    
    const emotes = await TwitchEmote.find({});
    emotes.forEach(emote => {
        if (data.enabled.hasOwnProperty(emote._id)) {
            emote.enabled = true;
        } else {
            emote.enabled = false;
        }
        const name = data[emote._id + "-name"];
        if (name) {
            emote.displayName = name;
        }
    });
    for (let i = 0; i < emotes.length; i++) {
        await emotes[i].save();
    }
    res.redirect("/?info=Emotes+updated!+Changes+may+take+30+seconds+to+take+effect");
});

router.post("/new", async (req, res) => {
    if (!req?.body?.emote) {
        return res.redirect("/?error=Unable+to+get+emote+attribute");
    }
    const emote = fetcher.emotes.get(req.body.emote)

    if (!emote) {
        return res.redirect("/?error=Emote+not+found!");
    }

    await TwitchEmote.create({
        _id: emote.id,
        platform: emote.type,
        code: emote.code,
        link: emote.toLink(),
        displayName: emote.code,
        requirements: global.defaultRequirements,
    });

    res.redirect(`/?info=Emote+${encodeURIComponent(emote.code)}+added!`);
});

router.post("/requirements", async (req, res) => {
    if (!req?.body?.emoteCount || !req?.body?.emoteTime || !req?.body?.maxPerUser || !req?.body?.lastingTime) {
        return res.redirect("/?error=Missing+parameter");
    }

    const emoteCount = Number(req.body.emoteCount);
    const emoteTime = Number(req.body.emoteTime);
    const maxPerUser = Number(req.body.maxPerUser);
    const lastingTime = Number(req.body.lastingTime);

    if (isNaN(emoteCount + emoteTime + maxPerUser + lastingTime)) {
        return res.redirect("/?error=At+least+one+variable+is+not+a+number!");
    }

    const settings = await utils.settings.get();

    settings.emoteRequirements = {
        emoteCount, emoteTime, maxPerUser, lastingTime,
    };

    await utils.settings.save();
    
    res.redirect("/?info=Requirements+updated!");
});

router.get("/delete/:id", async (req, res) => {
    await TwitchEmote.findByIdAndDelete(req.params.id);
    res.redirect("/?info=Emote+deleted!");
});

module.exports = router;
