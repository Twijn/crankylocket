const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    twitchUser: {
        type: String,
        required: true,
        index: true,
    },
    twitchUserDisplayName: {
        type: String,
        required: true,
    },
    discordUserId: {
        type: String,
        required: true,
        index: true,
    },
    discordUserName: {
        type: String,
        required: true,
    },
    roleId: {
        type: String,
        required: true,
        index: true,
    },
    roleName: {
        type: String,
        required: true,
    },
    roleColor: {
        type: String,
        default: null,
    },
    broadcasterId: {
        type: String,
        required: true,
        index: true,
    },
    redemptionId: {
        type: String,
        required: true,
        unique: true,
    },
    timestamp: {
        type: Date,
        default: () => new Date(),
        index: true,
    },
});

// Compound indexes for optimized stats queries
schema.index({ timestamp: -1 });
schema.index({ roleId: 1, timestamp: -1 });

/**
 * Get comprehensive stats for role wheel redemptions
 * @returns {Promise<Object>} Stats object with total redemptions, role distribution, recent activity
 */
schema.statics.getStats = async function() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [aggregateStats, roleDistribution, recentStats, recentRedemptions, uniqueUsers] = await Promise.all([
        // Get total redemptions count
        this.aggregate([
            {
                $group: {
                    _id: null,
                    totalRedemptions: { $sum: 1 },
                }
            }
        ]),
        // Get role distribution (top roles)
        this.aggregate([
            {
                $group: {
                    _id: "$roleId",
                    roleName: { $first: "$roleName" },
                    roleColor: { $first: "$roleColor" },
                    count: { $sum: 1 },
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]),
        // Get recent stats (7 and 30 day counts)
        this.aggregate([
            {
                $facet: {
                    last7Days: [
                        { $match: { timestamp: { $gte: last7Days } } },
                        { $count: "count" }
                    ],
                    last30Days: [
                        { $match: { timestamp: { $gte: last30Days } } },
                        { $count: "count" }
                    ]
                }
            }
        ]),
        // Get 10 most recent redemptions
        this.find({}).sort({ timestamp: -1 }).limit(10).lean(),
        // Get unique users count
        this.aggregate([
            {
                $group: {
                    _id: "$discordUserId",
                }
            },
            { $count: "count" }
        ])
    ]);

    const stats = aggregateStats[0] || { totalRedemptions: 0 };
    const recent = recentStats[0] || { last7Days: [], last30Days: [] };
    const last7 = recent.last7Days[0] || { count: 0 };
    const last30 = recent.last30Days[0] || { count: 0 };
    const uniqueCount = uniqueUsers[0]?.count || 0;

    return {
        totalRedemptions: stats.totalRedemptions || 0,
        uniqueUsers: uniqueCount,
        recent: {
            last7Days: last7.count || 0,
            last30Days: last30.count || 0,
        },
        roleDistribution: roleDistribution.map(r => ({
            roleId: r._id,
            roleName: r.roleName,
            roleColor: r.roleColor,
            count: r.count,
            percentage: stats.totalRedemptions > 0 
                ? Math.round((r.count / stats.totalRedemptions) * 1000) / 10 
                : 0,
        })),
        recentRedemptions: recentRedemptions.map(r => ({
            twitchUser: r.twitchUserDisplayName,
            discordUser: r.discordUserName,
            roleName: r.roleName,
            roleColor: r.roleColor,
            timestamp: r.timestamp,
        })),
    };
};

module.exports = mongoose.model("RoleWheelRedemption", schema);
