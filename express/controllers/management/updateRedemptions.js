const express = require("express");
const router = express.Router();

const { TwitchReward } = require("../../../schemas");

router.post("/", async (req, res) => {
    let body = req?.body;
    if (!body) body = {};
    if (!body?.roleAdd) body.roleAdd = {};

    const rewards = await TwitchReward.find({});
    for (let i = 0; i < rewards.length; i++) {
        rewards[i].settings.roleAdd = body.roleAdd.hasOwnProperty(rewards[i]._id);
        await rewards[i].save();
    }
    res.redirect("/?info=Reward+settings+updated!");
});

module.exports = router;
