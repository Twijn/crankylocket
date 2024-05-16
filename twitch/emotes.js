const { EmoteFetcher } = require("@mkody/twitch-emoticons");
const { TwitchToken } = require("../schemas");

const fetcher = new EmoteFetcher(
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_CLIENT_SECRET
);

const fetchEmotes = async () => {
    const startTime = Date.now();

    const channels = await TwitchToken.find({'settings.useAsChannel': true});

    try {
        await fetcher.fetchBTTVEmotes();
    } catch(err) {
        console.error("Error fetching global BTTV emotes");
        console.error(err);
    }

    try {
        await fetcher.fetchFFZEmotes();
    } catch(err) {
        console.error("Error fetching global FFZ emotes");
        console.error(err);
    }

    try {
        await fetcher.fetchSevenTVEmotes();
    } catch(err) {
        console.error("Error fetching global 7TV emotes");
        console.error(err);
    }

    try {
        await fetcher.fetchTwitchEmotes();
    } catch(err) {
        console.error("Error fetching global Twitch emotes");
        console.error(err);
    }

    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];

        let changed = false;

        if (!channel?.emotes) {
            channel.emotes = {
                bttv: true,
                ffz: true,
                seventv: true,
                twitch: true,
            }
            changed = true;
        }

        if (channel?.emotes?.bttv) {
            try {
                await fetcher.fetchBTTVEmotes(channel.user);
            } catch(err) {
                console.error("Error fetching BTTV emotes for " + channel.userDisplayName);
                channel.emotes.bttv = false;
                changed = true;
            }
        }

        if (channel?.emotes?.ffz) {
            try {
                await fetcher.fetchFFZEmotes(channel.user);
            } catch(err) {
                console.error("Error fetching FFZ emotes for " + channel.userDisplayName);
                channel.emotes.ffz = false;
                changed = true;
            }
        }

        if (channel?.emotes?.seventv) {
            try {
                await fetcher.fetchSevenTVEmotes(channel.user);
            } catch(err) {
                console.error("Error fetching 7TV emotes for " + channel.userDisplayName);
                channel.emotes.seventv = false;
                changed = true;
            }
        }

        if (channel?.emotes?.twitch) {
            try {
                await fetcher.fetchTwitchEmotes(channel.user);
            } catch(err) {
                console.error("Error fetching Twitch emotes for " + channel.userDisplayName);
                channel.emotes.twitch = false;
                changed = true;
            }
        }

        if (changed) {
            await channel.save();
        }
    }

    console.log(`Fetched ${fetcher.emotes.size} emotes in ${Date.now() - startTime} ms`);
}

fetchEmotes().catch(console.error);

module.exports = fetcher;
