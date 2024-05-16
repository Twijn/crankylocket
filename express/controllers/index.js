const express = require("express");
const router = express.Router();

const management = require("./management");
const overlay = require("./overlay");

router.use("/overlay", overlay);

router.use((req, res, next) => {
    if (req?.cookies?.session) {
        if (req.sessions.includes(req.cookies.session)) {
            return next();
        }
    }
    res.cookie("redirect_uri", req.path);
    res.redirect("/auth");
});

router.use("/", management);

module.exports = router;
