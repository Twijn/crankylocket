const {ApiClient} = require("@twurple/api");
const {RefreshingAuthProvider} = require("@twurple/auth");

const {TwitchToken} = require("../schemas");

const authProvider = new RefreshingAuthProvider({
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    redirectUri: process.env.EXPRESS_URI + "auth",
});

const api = new ApiClient({ authProvider });

authProvider.onRefresh(async (userId, tokenData) => {
    console.log("Refreshing token for " + userId);
    await TwitchToken.findOneAndUpdate({
        user: userId,
    }, {
        tokenData,
    }, {
        upsert: true,
        new: true,
    });
});

global.authSetup = false;

(async () => {
    const tokens = await TwitchToken.find({});

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        authProvider.addUser(token.user, token.tokenData);
        
        if (token.settings.useAsBot) {
            authProvider.addIntentsToUser(token.user, ["chat"]);
        }
    }

    if (tokens.length >= 1) {
        global.authSetup = true;
        global.activeUsers = tokens.filter(x => x.settings.useAsChannel).map(x => x.user);

        require("./index")(api, authProvider);
    }

    console.log(`Added ${tokens.length} pre-existing tokens to AuthProvider`);
})();

module.exports = {
    authProvider,
    api,
}
