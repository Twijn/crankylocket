const express = require("express");
const router = express.Router();

const { DiscordRole } = require("../../../schemas");

router.get("/", async (req, res) => {
    const roles = await DiscordRole
        .find({'settings.roleAdd': true})
        .sort({position: -1});

    res.json(roles.map(x => x.json()));
});

module.exports = router;
