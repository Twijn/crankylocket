const express = require("express");

const {TwitchToken} = require("../schemas");
const {authProvider, api} = require("../twitch/api");
const generateRandomString = require("../utils/generateRandomString");

const router = express.Router();

const TWITCH_URI = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.EXPRESS_URI}auth&scope=user%3Aread%3Aemail+chat%3Aedit+chat%3Aread+channel%3Aread%3Aredemptions`;

router.get("/", (req, res) => {
    if (req?.query?.code) {
        authProvider.addUserForCode(req.query.code, ["chat"]).then(async user => {
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
                }, {
                    upsert: true,
                    new: true,
                })

                global.activeUsers = [user];
    
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

                if (!token.settings.authorized) {
                    return res.send("You are not authorized to access this yet!");
                }
            }

            const sessionId = generateRandomString(64);
            req.sessions.push(sessionId);
            res.cookie("session", sessionId);
            // if (req?.cookies?.redirect_uri && req.cookies.redirect_uri.length > 0) {
            //     res.redirect(req.cookies.redirect_uri);
            // } else {
            //     res.redirect("/");
            // }
            res.redirect("/");
        }, err => {
            res.redirect(TWITCH_URI);
        });
    } else {
        res.redirect(TWITCH_URI);
    }
});

module.exports = router;
