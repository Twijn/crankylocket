const express = require("express");
const router = express.Router();

let websockets = [];

let nextWebsocketId = 1;

router.ws("/", (ws, req) => {
    ws.id = nextWebsocketId++;

    console.log("New websocket " + ws.id);
    websockets.push(ws);

    ws.on("close", () => {
        websockets = websockets.filter(x => x.id !== ws.id);
        console.log("Closed socket " + ws.id);
    })
});

const broadcast = message => {
    if (typeof(message) === "object") {
        message = JSON.stringify(message);
    }
    websockets.forEach(ws => {
        ws.send(message);
    });
}

setInterval(() => {
    broadcast({type: "keep-alive"});
}, 10000);

module.exports = {
    router,
    broadcast,
};
