const express = require("express");
const router = express.Router();

const roles = require("./roles");
const members = require("./members");

router.use("/roles", roles);
router.use("/members", members);

module.exports = router;
