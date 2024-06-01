const express = require("express");
const router = express.Router();

const {TwitchToken} = require("../../../schemas");

router.post("/", async (req, res) => {
    const data = req?.body;
    if (!data?.authorized) {
        return res.redirect("/?error=At+least+one+user+must+be+authorized");
    }
    if (!data?.useAsBot) {
        return res.redirect("/?error=One+user+must+be+used+as+bot");
    }
    if (!data?.useAsChannel) {
        return res.redirect("/?error=One+user+must+be+used+as+channel");
    }
    
    const tokens = await TwitchToken.find({});
    tokens.forEach(token => {
        if (data.authorized.hasOwnProperty(token.user)) {
            token.settings.authorized = true;
        } else {
            token.settings.authorized = false;
        }
        if (data.useAsBot === token.user) {
            token.settings.useAsBot = true;
        } else {
            token.settings.useAsBot = false;
        }
        if (data.useAsChannel.hasOwnProperty(token.user)) {
            token.settings.useAsChannel = true;
        } else {
            token.settings.useAsChannel = false;
        }
    });
    for (let i = 0; i < tokens.length; i++) {
        await tokens[i].save();
    }
    res.redirect("/?restart&info=" + encodeURIComponent("Success! The server will be stopped to take the changes into account, and this page will refresh in a couple seconds."));
    setTimeout(() => {
        console.log("Stopping server as channel options were changed!");
        process.exit(1);
    }, 500);
});

module.exports = router;
