const express = require("express");
const router = express.Router();

const { DiscordRole } = require("../../../schemas");

router.post("/", async (req, res) => {
    let body = req?.body;
    if (!body) body = {};
    if (!body?.roleAdd) body.roleAdd = {};

    const roles = await DiscordRole.find({});
    for (let i = 0; i < roles.length; i++) {
        roles[i].settings.roleAdd = body.roleAdd.hasOwnProperty(roles[i]._id);
        if (body.wheelColor.hasOwnProperty(roles[i]._id)) {
            roles[i].settings.wheelColor = body.wheelColor[roles[i]._id];
        }
        if (body.wheelTextColor.hasOwnProperty(roles[i]._id)) {
            roles[i].settings.wheelTextColor = body.wheelTextColor[roles[i]._id];
        }
        await roles[i].save();
    }
    res.redirect("/?info=Role+settings+updated!");
});

module.exports = router;
