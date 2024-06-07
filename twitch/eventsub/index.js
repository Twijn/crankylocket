const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");

const {DiscordRole, TwitchReward} = require("../../schemas");
const utils = require("../../utils");
const discordClient = require("../../discord");

const {broadcast, eventHandler} = require("../../express/ws");

let listener;

const MIN_DEG = 25 * 360; // 25 spins
const MAX_DEG = 32 * 360; // 32 spins

/**
 * @type {ApiClient}
 */
let client = null;

/**
 * @type {{id: string, broadcasterId: string, userName: string, roleName: string}[]}
 */
let incompleteRedemptions = [];

eventHandler.onRoleWheelCompleted(data => {
    const redemption = incompleteRedemptions.find(x => x.id === data.id);
    
    if (!redemption) {
        return console.error("Failed to find redemption " + data.id);
    }

    console.log("Sending completed role spin message for " + redemption.userName);
    sendCompletedSpinMessage(redemption.broadcasterId, redemption.userName, redemption.roleName);
});

/**
 * Sends the completed spin message to Twitch chat
 * @param {string} broadcasterId 
 * @param {string} userName 
 * @param {string} roleName 
 */
const sendCompletedSpinMessage = (broadcasterId, userName, roleName) => {
    client.asIntent(["chat"], ctx => {
        ctx.chat.sendChatMessage(broadcasterId, `${userName} was placed in ${roleName}! meiyaYay`).catch(console.error);
    });
}

/**
 * Initializes Twitch
 * @param {ApiClient} apiClient 
 */
module.exports = function(apiClient) {
    client = apiClient;

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
                x.user.username.toLowerCase() === redemption.input.trim().toLowerCase() ||
                x.id === redemption.input.trim()
            )

            if (!user) {
                user = await guild.members.fetch(redemption.input.trim());
            }
        } catch(err) {
            console.error(err);
        }

        if (!user) {
            console.log(`Failed to find user ${redemption.input.trim()} for role spin`)
            return cancelRedemption(`Unable to find user '${redemption.input.trim()}'! Try using your discord ID, and make sure you are a member of ${guild?.name ? guild.name + " on Discord" : "Discord"}.`);
        }

        let chosenRole = null;

        const roles = await DiscordRole
            .find({'settings.roleAdd': true})
            .sort({position: 1});

        const existingRoles = user.roles.cache.filter(x => roles.find(y => y._id === x.id));

        if (settings.wheelSetting === "block") {
            if (existingRoles.size > 0) {
                console.log(`Failed to add additional role to ${user.user.username}`);
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
            const numberOfWebsockets = broadcast({
                id: redemption.id,
                type: "role-wheel",
                endDeg,
                role: {
                    name: chosenRole.name,
                    backgroundColor: chosenRole?.settings?.wheelColor ? chosenRole.settings.wheelColor : chosenRole.color,
                    textColor: chosenRole?.settings?.wheelTextColor ? chosenRole.settings.wheelTextColor : "white",
                },
                user: {
                    id: user.id,
                    displayName: user.user.username,
                    avatar: user.displayAvatarURL({size: 128}),
                },
            });
            // redemption.updateStatus("FULFILLED").catch(console.error);

            console.log(`${user.user.username} successfully spun the wheel for ${chosenRole.name}!`);

            if (numberOfWebsockets === 0) {
                console.log("Sending confirmation message immediately as no websockets are connected!");
                sendCompletedSpinMessage(redemption.broadcasterId, user.user.username, chosenRole.name);
            } else {
                incompleteRedemptions.push({
                    id: redemption.id,
                    broadcasterId: redemption.broadcasterId,
                    userName: user.user.username,
                    roleName: chosenRole.name,
                });
            }
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
