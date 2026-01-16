const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    emoteId: {
        type: String,
        required: true,
        index: true,
    },
    emoteCode: {
        type: String,
        required: true,
    },
    reactions: {
        type: Number,
        required: true,
        index: true,
    },
    startTime: {
        type: Date,
        required: true,
        index: true,
    },
    endTime: {
        type: Date,
        default: () => new Date(),
    },
});

// Compound indexes for optimized stats queries
schema.index({ emoteId: 1, reactions: -1 });
schema.index({ reactions: -1, startTime: -1 });

/**
 * Get comprehensive stats for wisp reactions
 * @returns {Promise<Object>} Stats object with totalReactions, reactionCount, highestReaction, topEmotes
 */
schema.statics.getStats = async function() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [aggregateStats, topEmotes, highestReaction, recentStats, uniqueEmotes, lastReaction, recentReactions] = await Promise.all([
        // Get total reactions sum and count
        this.aggregate([
            {
                $group: {
                    _id: null,
                    totalReactions: { $sum: "$reactions" },
                    reactionCount: { $sum: 1 },
                    avgReactions: { $avg: "$reactions" },
                }
            }
        ]),
        // Get top 5 emotes by total reactions
        this.aggregate([
            {
                $group: {
                    _id: "$emoteId",
                    emoteCode: { $first: "$emoteCode" },
                    totalReactions: { $sum: "$reactions" },
                    timesTriggered: { $sum: 1 },
                    avgPerTrigger: { $avg: "$reactions" },
                    peakReaction: { $max: "$reactions" },
                }
            },
            { $sort: { totalReactions: -1 } },
            { $limit: 5 }
        ]),
        // Get highest single reaction event
        this.findOne({}).sort({ reactions: -1 }).lean(),
        // Get recent activity (last 7 days and 30 days)
        this.aggregate([
            {
                $facet: {
                    last7Days: [
                        { $match: { startTime: { $gte: last7Days } } },
                        { $group: { _id: null, count: { $sum: 1 }, reactions: { $sum: "$reactions" } } }
                    ],
                    last30Days: [
                        { $match: { startTime: { $gte: last30Days } } },
                        { $group: { _id: null, count: { $sum: 1 }, reactions: { $sum: "$reactions" } } }
                    ]
                }
            }
        ]),
        // Count unique emotes used
        this.distinct("emoteId"),
        // Get most recent reaction
        this.findOne({}).sort({ startTime: -1 }).lean(),
        // Get 10 most recent reactions
        this.find({}).sort({ startTime: -1 }).limit(10).lean()
    ]);

    const stats = aggregateStats[0] || {
        totalReactions: 0,
        reactionCount: 0,
        avgReactions: 0,
    };

    const recent = recentStats[0] || { last7Days: [], last30Days: [] };
    const last7 = recent.last7Days[0] || { count: 0, reactions: 0 };
    const last30 = recent.last30Days[0] || { count: 0, reactions: 0 };

    // Get emote links from the fetcher (live emote cache) since not all emotes
    // are in the TwitchEmote database - only ones explicitly added by the user
    const fetcher = require("../twitch/emotes");
    
    // Build emote link map from emote codes
    const getEmoteLink = (emoteCode) => {
        const emote = fetcher.emotes.get(emoteCode);
        return emote ? emote.toLink() : null;
    };

    return {
        totalReactions: stats.totalReactions || 0,
        reactionCount: stats.reactionCount || 0,
        avgReactions: Math.round((stats.avgReactions || 0) * 10) / 10,
        uniqueEmotesUsed: uniqueEmotes.length,
        highestReaction: highestReaction ? {
            reactions: highestReaction.reactions,
            emoteCode: highestReaction.emoteCode,
            emoteLink: getEmoteLink(highestReaction.emoteCode),
            date: highestReaction.startTime,
        } : null,
        lastReaction: lastReaction ? {
            emoteCode: lastReaction.emoteCode,
            reactions: lastReaction.reactions,
            date: lastReaction.startTime,
        } : null,
        recent: {
            last7Days: { triggers: last7.count, reactions: last7.reactions },
            last30Days: { triggers: last30.count, reactions: last30.reactions },
        },
        topEmotes: topEmotes.map(e => ({
            emoteId: e._id,
            emoteCode: e.emoteCode,
            emoteLink: getEmoteLink(e.emoteCode),
            totalReactions: e.totalReactions,
            timesTriggered: e.timesTriggered,
            avgPerTrigger: Math.round(e.avgPerTrigger * 10) / 10,
            peakReaction: e.peakReaction,
        })),
        recentReactions: recentReactions.map(r => ({
            emoteId: r.emoteId,
            emoteCode: r.emoteCode,
            emoteLink: getEmoteLink(r.emoteCode),
            reactions: r.reactions,
            startTime: r.startTime,
            endTime: r.endTime,
        })),
    };
};

module.exports = mongoose.model("WispReaction", schema);
