const express = require("express");
const router = express.Router();

const roles = require("./roles");

router.use("/roles", roles);

module.exports = router;
