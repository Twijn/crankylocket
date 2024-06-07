const { AuthProvider } = require("@twurple/auth")
const { ChatClient } = require("@twurple/chat");
const { Emote } = require("@mkody/twitch-emoticons");
const { TwitchToken, TwitchEmote } = require("../../schemas");
const { broadcast } = require("../../express/ws");

const fetcher = require("../emotes");
const utils = require("../../utils");
const {api} = require("../api");

const {WispReaction} = require("../../schemas");

let listener;

/**
 * @type {{emote:Emote,broadcasterId:string,count:number,until:Date,startTime:number}?}
 */
let currentReaction = null;

/**
 * @type {{emote: string, user: string, time: Date}[]}
 */
let emoteCounts = [];

let dbEmotes = [];

const updateDatabaseEmotes = async () => {
    dbEmotes = await TwitchEmote.find({});
}

setInterval(updateDatabaseEmotes, 30000);
updateDatabaseEmotes().catch(console.error);

/**
 * @param {Emote} emote 
 * @param {number} currentCount
 * @param {"wisp"|"emote"} reactionSetting
 */
const announceEmote = (emote, currentCount, reactionSetting = "emote") => {
    let dbEmote = dbEmotes.find(x => x._id === emote.id);
    let displayName = emote.code;
    
    if (dbEmote) {
        displayName = dbEmote.displayName;
        if (!dbEmote.enabled) return;
    }

    if (reactionSetting === "wisp") {
        displayName = "wisp";
    }

    if (currentCount === 250 || currentCount % 250 === 0) {
        wispStreak(currentReaction.broadcasterId, emote.code, currentCount);
    }
    
    broadcast({
        type: "live-reaction",
        emote: {
            code: emote.code,
            displayName,
            url: emote.toLink(2),
        },
        count: currentCount,
    });
}

/**
 * 
 * @param {string} emoteId 
 * @param {{emoteCount:number,emoteTime:number,maxPerUser:number,lastingTime:number}} emoteRequirements 
 */
const calculateCount = (emoteId, emoteRequirements) => {
    const allLogs = emoteCounts.filter(x => x.emote === emoteId);

    let logUsers = [];
    let realLogs = [];

    allLogs.forEach(log => {
        logUsers.push(log.user);
        if (logUsers.filter(x => x === log.user).length > emoteRequirements.maxPerUser)
            return;
        realLogs.push(log);
    });

    return realLogs.length;
}

/**
     * Converts a number into a string with commas
     * Example: 130456 -> 130,456
     * @param {number} num 
     * @returns {string}
     */
const comma = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 
 * @param {string} broadcasterId 
 * @param {string} code
 * @param {number} count 
 */
const wispStreak = async (broadcasterId, code, count) => {
    code = code + " ";
    api.asIntent(["chat"], ctx => {
        ctx.chat.sendChatMessage(broadcasterId, `${code.repeat(3)} reached wisp reaction milestone of ${comma(count)}!! ${code.repeat(3)}`.trim());
    });
}

/**
 * 
 * @param {string} broadcasterId 
 */
const stopReaction = async broadcasterId => {
    if (!currentReaction) return;

    const topWispReactions = await WispReaction
        .find({})
        .sort({reactions: -1})
        .limit(1);

    if (topWispReactions.length === 0 || currentReaction.count > topWispReactions[0].reactions) {
        api.asIntent(["chat"], ctx => {
            ctx.chat.sendChatMessage(broadcasterId, `${`${currentReaction.emote.code} `.repeat(4)}new wisp reaction record of ${comma(currentReaction.count)}${topWispReactions.length === 0 ? "!" : `, beating the previous of ${comma(topWispReactions[0].reactions)}!`} ${`${currentReaction.emote.code} `.repeat(4)}`.trim());
        });
    }

    await WispReaction.create({
        emoteId: currentReaction.emote.id,
        emoteCode: currentReaction.emote.code,
        reactions: currentReaction.count,
        startTime: currentReaction.startTime,
    });

    currentReaction = null;
    emoteCounts = [];
}

/**
 * @param {string} broadcasterId
 * @param {Emote} emote 
 * @param {string} user 
 */
const logEmote = async (broadcasterId, emote, user) => {
    const { emoteRequirements, reactionSetting } = await utils.settings.get();

    if (currentReaction) {
        if (currentReaction.until > Date.now()) {
            if (currentReaction.emote.id === emote.id) {
                announceEmote(emote, ++currentReaction.count, reactionSetting);
                currentReaction.until = Date.now() + (emoteRequirements.lastingTime * 1000);
            }
            return;
        } else {
            try {
                await stopReaction(broadcasterId);
            } catch(err) {
                console.error(err);
            }
        }
    }

    emoteCounts.push({
        emote: emote.id,
        user,
        time: Date.now(),
    });

    let currentCount = calculateCount(emote.id, emoteRequirements);
    if (currentCount >= emoteRequirements.emoteCount) {
        currentReaction = {
            broadcasterId,
            emote,
            requirements: emoteRequirements,
            until: Date.now() + (emoteRequirements.lastingTime * 1000),
            count: currentCount,
            startTime: Date.now(),
        };
        announceEmote(emote, currentCount, reactionSetting);
    }
}

let cachedEmoteTime = null;
let i = 0;
setInterval(async () => {
    const currentTime = Date.now();

    if (!cachedEmoteTime || i % 100 === 0) {
        cachedEmoteTime = (await utils.settings.get()).emoteRequirements.emoteTime;
    }

    emoteCounts = emoteCounts.filter(x => currentTime - x.time < cachedEmoteTime * 1000);
    i++;

    if (i % 10 === 0 && currentReaction) {
        if (Date.now() >= currentReaction.until) {
            stopReaction(currentReaction.broadcasterId).catch(console.error);
        }
    }
}, 100);

/**
 * Initializes Twitch Messaging Interface
 * @param {AuthProvider} authProvider 
 */
module.exports = async function(authProvider) {
    const channels = await TwitchToken.find({'settings.useAsChannel': true});
    
    listener = new ChatClient({
        authProvider,
        authIntents: ["chat"],
        channels: channels.map(x => x.userDisplayName.toLowerCase()),
    });

    console.log(`Creating chat client to connect to ${channels.map(x => x.userDisplayName).join(", ")}`);
    
    listener.onConnect(e => {
        console.log("Connected to TMI");
    })

    listener.onMessage((channel, user, text, msg) => {
        const words = text.split(" ");
        let recognizedWords = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            // prevent multiple of the same emote from triggering multiple emotes
            if (recognizedWords.includes(word.toLowerCase())) continue;
            recognizedWords.push(word.toLowerCase());

            let emote = null;
            if (fetcher.emotes.has(word)) {
                emote = fetcher.emotes.get(word);
            } else {
                let removeColon = word.replace(/:(\w+):/g, "$1");

                if (!removeColon) continue;
                if (!fetcher.emotes.has(removeColon)) continue;

                emote = fetcher.emotes.get(removeColon);
            }

            if (emote) {
                logEmote(msg.channelId, emote, msg.userInfo.userId).catch(console.error);
            }
        }
    });
    
    listener.connect();
}
