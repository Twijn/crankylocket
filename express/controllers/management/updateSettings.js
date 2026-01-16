const express = require("express");
const router = express.Router();

const utils = require("../../../utils");
const ws = require("../../ws");

router.post("/", async (req, res) => {
    const settings = await utils.settings.get();
    if (!req?.body?.wheelPosition ||
        !req?.body?.reactionPosition ||
        !req?.body?.reactionSetting ||
        !req?.body?.wheelSetting
    ) {
        return res.redirect("/settings?error=Missing+parameter");
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
    settings.wheelSetting = req.body.wheelSetting;

    await settings.save();

    // Broadcast overlay refresh to all connected clients
    ws.broadcast({
        type: "refresh-overlay",
        message: "Refreshing overlay: settings updated",
    });

    res.redirect("/settings?info=Settings+updated!+Overlays+will+refresh+automatically.");
});

module.exports = router;
