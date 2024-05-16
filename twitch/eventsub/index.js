const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");

const {TwitchReward} = require("../../schemas");

let listener;

/**
 * Initializes Twitch
 * @param {ApiClient} apiClient 
 */
module.exports = function(apiClient) {
    
    const roleHandler = redemption => {
        console.log(redemption);
    }

    listener = new EventSubWsListener({
        apiClient,
    });

    const currentDate = Date.now();

    global.activeUsers.forEach(user => {
        apiClient.channelPoints.getCustomRewards(user).then(async rewards => {
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];

                listener.onChannelRedemptionAddForReward(user, reward.id, roleHandler);
                
                await TwitchReward.findByIdAndUpdate(reward.id, {
                    title: reward.title,
                    backgroundColor: reward.backgroundColor,
                    broadcaster: reward.broadcasterId,
                    cost: reward.cost,
                    lastSeen: currentDate,
                }, {
                    upsert: true,
                    new: true,
                });
            }
            await TwitchReward.deleteMany({lastSeen: {$lt: currentDate}});
        }, console.error);
    });

    listener.start();
}
