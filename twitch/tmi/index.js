const { AuthProvider } = require("@twurple/auth")
const { ChatClient } = require("@twurple/chat");
const { Emote } = require("@mkody/twitch-emoticons");
const { TwitchToken, TwitchEmote } = require("../../schemas");
const { broadcast } = require("../../express/ws");

const fetcher = require("../emotes");

let listener;

let defaultRequirements = {
    emoteCount: 3,
    emoteTime: 10,
    maxPerUser: Infinity,
    lastingTime: 10,
};

/**
 * @type {{requirements:{emoteCount:number,emoteTime:number,maxPerUser:number,lastingTime:number},emote:Emote,count:number,until:Date}?}
 */
let currentReaction = null;

/**
 * @type {{emote: string, user: string, time: Date}[]}
 */
let emoteCounts = [];

let dbEmotes = [];

const updateDatabaseEmotes = async () => {
    dbEmotes = await TwitchEmote.find({});

    let emoteCount = 0;
    let emoteTime = 0;
    let maxPerUser = 0;
    let lastingTime = 0;

    dbEmotes.forEach(emote => {
        emoteCount += emote.requirements.emoteCount;
        emoteTime += emote.requirements.emoteTime;
        maxPerUser += emote.requirements.maxPerUser;
        lastingTime += emote.requirements.lastingTime;
    });

    emoteCount /= dbEmotes.length;
    emoteTime /= dbEmotes.length;
    maxPerUser /= dbEmotes.length;
    lastingTime /= dbEmotes.length;

    if (emoteCount > 0) {
        defaultRequirements = {
            emoteCount,
            emoteTime,
            maxPerUser,
            lastingTime,
        };
        global.defaultRequirements = defaultRequirements;
    }
}

setInterval(updateDatabaseEmotes, 30000);
updateDatabaseEmotes().catch(console.error);

/**
 * 
 * @param {Emote} emote 
 * @param {number} currentCount
 */
const announceEmote = (emote, currentCount) => {
    let dbEmote = dbEmotes.find(x => x._id === emote.id);
    let displayName = emote.code;
    if (dbEmote) {
        displayName = dbEmote.displayName;
        if (!dbEmote.enabled) return;
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
 * 
 * @param {Emote} emote 
 * @param {{emoteCount:number,emoteTime:number,maxPerUser:number,lastingTime:number}} emoteRequirements 
 * @param {string} user 
 */
const logEmote = (emote, emoteRequirements, user) => {
    emoteCounts.push({
        emote: emote.id,
        user,
        time: Date.now(),
    });

    if (currentReaction) {
        if (currentReaction.until > Date.now()) {
            if (currentReaction.emote.id === emote.id) {
                announceEmote(emote, ++currentReaction.count);
                currentReaction.until = Date.now() + (currentReaction.requirements.lastingTime * 1000);
            }
            return;
        } else {
            currentReaction = null;
            emoteCounts = [];
        }
    }

    let currentCount = calculateCount(emote.id, emoteRequirements);
    if (currentCount >= emoteRequirements.emoteCount) {
        currentReaction = {
            emote,
            requirements: emoteRequirements,
            until: Date.now() + (emoteRequirements.lastingTime * 1000),
            count: currentCount,
        }
        announceEmote(emote, currentCount);
    }
}

setInterval(() => {
    const currentTime = Date.now();
    emoteCounts = emoteCounts.filter(x => currentTime - x.time < defaultRequirements.emoteTime * 1000);
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
                const dbEmote = dbEmotes.find(x => x._id === emote.id);

                logEmote(emote, dbEmote ? dbEmote.requirements : defaultRequirements, msg.userInfo.userId);
            }
        }
    });
    
    listener.connect();
}
