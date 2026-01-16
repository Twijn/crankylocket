const express = require("express");
const router = express.Router();

const { DiscordRole, RoleWheelRedemption } = require("../../../schemas");
const utils = require("../../../utils");
const discordClient = require("../../../discord");
const ws = require("../../ws");

const roleWheelImageURI = "/assets/images/rolewheel/";

const MIN_DEG = 25 * 360; // 25 spins
const MAX_DEG = 32 * 360; // 32 spins

router.post("/", async (req, res) => {
    const { twitchUsername, discordMemberId } = req.body;

    if (!twitchUsername || !discordMemberId) {
        return res.redirect("/roles?error=" + encodeURIComponent("Both Twitch username and Discord member are required."));
    }

    try {
        const settings = await utils.settings.get();
        const guild = discordClient.guilds.cache.first();
        
        if (!guild) {
            return res.redirect("/roles?error=" + encodeURIComponent("No Discord guild found."));
        }

        // Try to get from cache first, then fetch single member if not found
        let user = guild.members.cache.get(discordMemberId);
        if (!user) {
            try {
                user = await guild.members.fetch(discordMemberId);
            } catch (fetchErr) {
                console.error("Failed to fetch member:", fetchErr);
            }
        }

        if (!user) {
            return res.redirect("/roles?error=" + encodeURIComponent("Discord member not found."));
        }

        const roles = await DiscordRole
            .find({'settings.roleAdd': true})
            .sort({position: 1});

        if (roles.length === 0) {
            return res.redirect("/roles?error=" + encodeURIComponent("No roles are configured for the role wheel."));
        }

        const existingRoles = user.roles.cache.filter(x => roles.find(y => y._id === x.id));

        if (settings.wheelSetting === "block") {
            if (existingRoles.size > 0) {
                return res.redirect("/roles?error=" + encodeURIComponent(`${user.user.username} already has the ${existingRoles.map(x => x.name).join(", ")} role!`));
            }
        } else if (settings.wheelSetting === "remove") {
            try {
                await user.roles.remove(existingRoles);
            } catch(err) {
                console.error(err);
                return res.redirect("/roles?error=" + encodeURIComponent("Unable to remove existing roles from user."));
            }
        }

        const endDeg = utils.generateRandomNumber(MIN_DEG, MAX_DEG, true);
        let absoluteDeg = endDeg % 360;

        let chosenRole = null;
        let deg = 0;
        let sliceSize = 360 / roles.length;

        roles.forEach(role => {
            if (absoluteDeg >= deg && absoluteDeg < deg + sliceSize) {
                chosenRole = role;
            }
            deg += sliceSize;
        });

        if (!chosenRole) {
            return res.redirect("/roles?error=" + encodeURIComponent("Failed to determine role. Try again."));
        }

        // Add the role
        await user.roles.add(chosenRole._id);

        // Generate a unique redemption ID for the override
        const redemptionId = `override-${Date.now()}-${utils.generateRandomString(8)}`;

        // Save the redemption to the database
        try {
            await RoleWheelRedemption.create({
                twitchUser: "override",
                twitchUserDisplayName: twitchUsername.trim(),
                discordUserId: user.id,
                discordUserName: user.user.username,
                roleId: chosenRole._id,
                roleName: chosenRole.name,
                roleColor: chosenRole.color,
                broadcasterId: "override",
                redemptionId: redemptionId,
            });
        } catch (err) {
            console.error("Failed to save override role wheel redemption:", err);
        }

        // Broadcast to overlay
        ws.broadcast({
            id: redemptionId,
            type: "role-wheel",
            endDeg,
            role: {
                name: chosenRole.name,
                backgroundColor: chosenRole?.settings?.wheelColor ? chosenRole.settings.wheelColor : chosenRole.color,
                textColor: chosenRole?.settings?.wheelTextColor ? chosenRole.settings.wheelTextColor : "white",
            },
            user: {
                id: user.id,
                displayName: twitchUsername.trim(),
                avatar: roleWheelImageURI + utils.generateRandomNumber(1, 10, true) + ".png",
            },
        });

        console.log(`[Override] ${twitchUsername} (${user.user.username}) successfully spun the wheel for ${chosenRole.name}!`);

        res.redirect("/roles?info=" + encodeURIComponent(`Role wheel spin triggered for ${twitchUsername} → ${chosenRole.name}`));
    } catch (err) {
        console.error("Role wheel override error:", err);
        res.redirect("/roles?error=" + encodeURIComponent("An error occurred: " + err.message));
    }
});

module.exports = router;
