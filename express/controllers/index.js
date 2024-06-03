const express = require("express");
const router = express.Router();

const management = require("./management");
const overlay = require("./overlay");
const json = require("./json");

router.use("/overlay", overlay);
router.use("/json", json);

router.use((req, res, next) => {
    if (req?.cookies?.m_session) {
        if (req.sessions.includes(req.cookies.m_session)) {
            return next();
        }
    }
    res.cookie("redirect_uri", req.path);
    res.redirect("/auth");
});

router.use("/", management);

module.exports = router;
