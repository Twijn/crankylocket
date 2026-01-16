const express = require("express");

const {TwitchToken} = require("../schemas");
const {authProvider, api} = require("../twitch/api");
const generateRandomString = require("../utils/generateRandomString");

const router = express.Router();

const TWITCH_URI = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.EXPRESS_URI}auth&scope=user%3Aread%3Aemail+chat%3Aedit+chat%3Aread+channel%3Aread%3Aredemptions+user%3Awrite%3Achat+channel%3Amanage%3Aredemptions`;

router.get("/", (req, res) => {
    if (req?.query?.code) {
        // Only add "chat" intent for first-time setup; otherwise add user without intents
        // The "chat" intent should only be assigned to the designated bot user
        const intents = global.authSetup ? [] : ["chat"];
        authProvider.addUserForCode(req.query.code, intents).then(async user => {
            const tokenData = await authProvider.getAccessTokenForUser(user);

            const helixUser = await api.users.getUserById(user);
            if (!global.authSetup) {
                await TwitchToken.findOneAndUpdate({
                    user,
                }, {
                    userDisplayName: helixUser.displayName,
                    tokenData,
                    'settings.authorized': true,
                    'settings.useAsBot': true,
                    'settings.useAsChannel': true,
                }, {
                    upsert: true,
                    new: true,
                })

                global.activeUsers = [user];
                global.authSetup = true;
    
                require("../twitch")(api, authProvider);
            } else {
                const token = await TwitchToken.findOneAndUpdate({
                    user,
                }, {
                    tokenData,
                    userDisplayName: helixUser.displayName,
                }, {
                    upsert: true,
                    new: true,
                })

                // If this user is the designated bot user, add the chat intent
                if (token.settings.useAsBot) {
                    authProvider.addIntentsToUser(user, ["chat"]);
                }

                if (!token.settings.authorized) {
                    return res.send("You are not authorized to access this yet!");
                }
            }

            const sessionId = generateRandomString(64);
            req.sessions.push(sessionId);
            res.cookie("m_session", sessionId, {domain: process.env.EXPRESS_COOKIE_DOMAIN});
            res.redirect("/");
        }, err => {
            res.redirect(TWITCH_URI);
        });
    } else {
        res.redirect(TWITCH_URI);
    }
});

router.get("/logout", (req, res) => {
    const sessionId = req.cookies?.m_session;
    if (sessionId) {
        const index = req.sessions.indexOf(sessionId);
        if (index > -1) {
            req.sessions.splice(index, 1);
        }
    }
    res.clearCookie("m_session", { domain: process.env.EXPRESS_COOKIE_DOMAIN });
    res.render("pages/logout");
});

module.exports = router;
