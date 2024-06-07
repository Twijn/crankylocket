const express = require("express");
const router = express.Router();

const {WebSocketEventHandler} = require("../../utils/index");
const eventHandler = new WebSocketEventHandler();

let websockets = [];

let nextWebsocketId = 1;

router.ws("/", (ws, req) => {
    ws.id = nextWebsocketId++;

    console.log("New websocket " + ws.id);
    websockets.push(ws);

    ws.on("message", msg => {
        try {
            const data = JSON.parse(msg);

            if (!data?.type) {
                return;
            }

            if (data.type === "role-wheel-completed") {
                if (typeof(data?.id) !== "string") {
                    return;
                }

                eventHandler.fire(data.type, data);
            }
        } catch(err) {
            console.error(`Failed to parse '${msg}' into json!`);
        }
    });

    ws.on("close", () => {
        websockets = websockets.filter(x => x.id !== ws.id);
        console.log("Closed socket " + ws.id);
    })
});

/**
 * Broadcasts a message to all connected websockets
 * @param {string|object} message The message to send
 * @returns {number} The number of websockets the message was broadcasted to
 */
const broadcast = message => {
    if (typeof(message) === "object") {
        message = JSON.stringify(message);
    }
    websockets.forEach(ws => {
        ws.send(message);
    });

    return websockets.length;
}

setInterval(() => {
    broadcast({type: "keep-alive"});
}, 10000);

module.exports = {
    router,
    broadcast,
    eventHandler,
};
