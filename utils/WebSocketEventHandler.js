const EventHandler = require("./EventHandler");

class WebSocketEventHandler extends EventHandler {

    /**
     * 
     * @param {function} event 
     */
    onRoleWheelCompleted(event) {
        super.on("role-wheel-completed", event);
    }

}

module.exports = WebSocketEventHandler;
