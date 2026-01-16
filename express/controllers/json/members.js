const express = require("express");
const router = express.Router();

const discordClient = require("../../../discord");

// Get Discord members for search
router.get("/", async (req, res) => {
    try {
        const guild = discordClient.guilds.cache.first();
        if (!guild) {
            return res.json({ error: "No guild found", members: [] });
        }

        const search = req.query.search?.toLowerCase() || "";
        
        // Use cached members to avoid rate limits
        let members = Array.from(guild.members.cache.values())
            .filter(m => !m.user.bot)
            .map(m => ({
                id: m.id,
                username: m.user.username,
                displayName: m.displayName,
                avatar: m.user.displayAvatarURL({ size: 32 }),
            }));

        if (search) {
            members = members.filter(m => 
                m.username.toLowerCase().includes(search) ||
                m.displayName.toLowerCase().includes(search) ||
                m.id.includes(search)
            );
        }

        // Limit to 25 results for performance
        members = members.slice(0, 25);

        res.json({ members });
    } catch (err) {
        console.error("Error fetching Discord members:", err);
        res.json({ error: err.message, members: [] });
    }
});

module.exports = router;
