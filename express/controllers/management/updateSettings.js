const express = require("express");
const router = express.Router();

const utils = require("../../../utils");

router.post("/", async (req, res) => {
    const settings = await utils.settings.get();
    if (!req?.body?.wheelPosition) {
        return res.redirect("/?error=Missing+parameter");
    }
    if (!req?.body?.reactionPosition) {
        return res.redirect("/?error=Missing+parameter");
    }
    if (!req?.body?.reactionSetting) {
        return res.redirect("/?error=Missing+parameter");
    }

    if (req.body.wheelPosition == 1) {
        settings.wheelCss = "right:2em;top:2em;";
    } else if (req.body.wheelPosition == 2) {
        settings.wheelCss = "right:2em;bottom:2em;";
    } else if (req.body.wheelPosition == 3) {
        settings.wheelCss = "left:2em;bottom:2em;";
    } else if (req.body.wheelPosition == 4) {
        settings.wheelCss = "left:2em;top:2em;";
    }

    if (req.body.reactionPosition == 1) {
        settings.reactionCss = "right:2em;top:2em;";
    } else if (req.body.reactionPosition == 2) {
        settings.reactionCss = "right:2em;bottom:2em;";
    } else if (req.body.reactionPosition == 3) {
        settings.reactionCss = "left:2em;bottom:2em;";
    } else if (req.body.reactionPosition == 4) {
        settings.reactionCss = "left:2em;top:2em;";
    }

    settings.reactionSetting = req.body.reactionSetting;

    await settings.save();

    res.redirect("/?info=Settings+updated!");
});

module.exports = router;
