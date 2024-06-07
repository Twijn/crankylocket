class EventHandler {

    /**
     * @type {[{type:string,event:function}]}
     */
    listeners = [];

    /**
     * Fires an event
     * @param {string} eventType 
     * @param {object} data 
     */
    fire(eventType, data) {
        this.listeners.filter(x => x.type === eventType).forEach(listener => {
            try {
                listener.event(data);
            } catch(err) {
                console.error(`Error while passing event ${eventType} to listener:\n${err}`)
            }
        });
    }

    /**
     * Creates a listener
     * @param {string} eventType 
     * @param {function} event 
     */
    on(eventType, event) {
        this.listeners.push({
            type: eventType,
            event,
        });
    }

}

module.exports = EventHandler;
