const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");

const {DiscordRole, TwitchReward} = require("../../schemas");
const utils = require("../../utils");
const discordClient = require("../../discord");

const {broadcast} = require("../../express/ws");

let listener;

const MIN_DEG = 25 * 360; // 25 spins
const MAX_DEG = 32 * 360; // 32 spins

/**
 * Initializes Twitch
 * @param {ApiClient} apiClient 
 */
module.exports = function(apiClient) {

    const roleHandler = async redemption => {
        const settings = await utils.settings.get();

        const cancelRedemption = message => {
            redemption.updateStatus("CANCELED").catch(console.error);
            apiClient.asIntent(["chat"], ctx => {
                ctx.chat.sendChatMessage(redemption.broadcasterId, message).catch(console.error);
            });
        }

        const endDeg = utils.generateRandomNumber(MIN_DEG, MAX_DEG, true);
        let absoluteDeg = endDeg % 360;

        let guild = null;
        let user = null;

        try {
            guild = discordClient.guilds.cache.first();
            await guild.members.fetch();
            user = guild.members.cache.find(x => 
                x.displayName.toLowerCase() === redemption.input.trim().toLowerCase() ||
                x.id === redemption.input.trim()
            )

            if (!user) {
                user = await guild.members.fetch(redemption.input.trim());
            }
        } catch(err) {
            console.error(err);
        }

        if (!user) {
            return cancelRedemption(`Unable to find user '${redemption.input.trim()}'! Try using your discord ID, and make sure you are a member of ${guild?.name ? guild.name + " on Discord" : "Discord"}.`);
        }

        let chosenRole = null;

        const roles = await DiscordRole
            .find({'settings.roleAdd': true})
            .sort({position: 1});

        const existingRoles = user.roles.cache.filter(x => roles.find(y => y._id === x.id));

        if (settings.wheelSetting === "block") {
            if (existingRoles.size > 0) {
                return cancelRedemption(`Unable to spin the wheel as you already have the ${existingRoles.map(x => x.name).join(", ")} role!`);
            }
        } else if (settings.wheelSetting === "remove") {
            try {
                await user.roles.remove(existingRoles);
            } catch(err) {
                console.error(err);
                return cancelRedemption("Unable to remove existing roles!");
            }
        }
        
        let deg = 0;
        let sliceSize = 360 / roles.length;

        roles.forEach(role => {
            if (absoluteDeg >= deg && absoluteDeg < deg + sliceSize) {
                chosenRole = role;
            }
            deg += sliceSize;
        });

        if (!chosenRole) {
            return cancelRedemption("Failed to determine role to add! Try again later.");
        }

        user.roles.add(chosenRole._id).then(() => {
            broadcast({
                type: "role-wheel",
                endDeg,
                role: {
                    name: chosenRole.name,
                    backgroundColor: chosenRole?.settings?.wheelColor ? chosenRole.settings.wheelColor : chosenRole.color,
                    textColor: chosenRole?.settings?.wheelTextColor ? chosenRole.settings.wheelTextColor : "white",
                },
                user: {
                    id: user.id,
                    displayName: user.displayName,
                    avatar: user.displayAvatarURL({size: 128}),
                },
            });
            redemption.updateStatus("FULFILLED").catch(console.error);
        }, err => {
            console.error(err);
            cancelRedemption("Unable to add the role to you!");
        });
    }

    listener = new EventSubWsListener({
        apiClient,
    });

    const currentDate = Date.now();

    global.activeUsers.forEach(user => {
        apiClient.channelPoints.getCustomRewards(user).then(async rewards => {
            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                
                const dbReward = await TwitchReward.findByIdAndUpdate(reward.id, {
                    title: reward.title,
                    backgroundColor: reward.backgroundColor,
                    broadcaster: reward.broadcasterId,
                    cost: reward.cost,
                    lastSeen: currentDate,
                }, {
                    upsert: true,
                    new: true,
                });

                if (dbReward.settings.roleAdd) {
                    listener.onChannelRedemptionAddForReward(user, reward.id, roleHandler);
                }
            }
            await TwitchReward.deleteMany({lastSeen: {$lt: currentDate}});
        }, console.error);
    });

    listener.start();
}
