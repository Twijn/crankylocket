const generateRandomNumber = require("./generateRandomNumber");
const generateRandomString = require("./generateRandomString");
const settings = require("./settings");

const WebSocketEventHandler = require("./WebSocketEventHandler");

const utils = {
    generateRandomNumber,
    generateRandomString,
    settings,

    WebSocketEventHandler,
};

module.exports = utils;
