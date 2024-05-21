const express = require("express");
const router = express.Router();

const fetcher = require("../../../twitch/emotes");
const utils = require("../../../utils");

router.get("/", async (req, res) => {
    const settings = await utils.settings.get();
    res.render("pages/overlay", {
        urls: fetcher.emotes.map(x => x.toLink(2)),
        settings,
    });
});

module.exports = router;
