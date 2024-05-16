const express = require("express");
const router = express.Router();

const fetcher = require("../../../twitch/emotes");

router.get("/", (req, res) => {
    res.render("pages/overlay", {
        urls: fetcher.emotes.map(x => x.toLink(2)),
    });
});

module.exports = router;
