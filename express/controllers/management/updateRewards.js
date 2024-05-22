const express = require("express");
const router = express.Router();

const { TwitchReward } = require("../../../schemas");
const { api } = require("../../../twitch/api");

router.get("/add", async (req, res) => {
    global.activeUsers.forEach(userId => {
        api.channelPoints.createCustomReward(userId, {
            title: "Spin Role Wheel",
            prompt: "Please enter your Discord username or ID",
            cost: 500,
            isEnabled: true,
            userInputRequired: true,
        }).then(reward => {
            TwitchReward.create({
                _id: reward.id,
                title: reward.title,
                backgroundColor: reward.backgroundColor,
                broadcaster: reward.broadcasterId,
                cost: reward.cost,
                addedByBot: true,
                settings: {
                    roleAdd: true,
                },
            }).then(dbReward => {
                res.redirect("/?info=Bot+reward+added!+Please+restart+the+server.");
            }, err => {
                console.error(err);
                res.redirect("/?error=Please+restart+the+server!");
            });
        }, err => {
            console.error(err);
            res.redirect("/?error=Unable+to+create+reward!");
        });
    });
});

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
