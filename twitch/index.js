const { AuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");

/**
 * Initializes Twitch
 * @param {ApiClient} apiClient 
 * @param {AuthProvider} authProvider
 */
module.exports = function(apiClient, authProvider) {
    require("./tmi")(authProvider);
    require("./eventsub")(apiClient);
}
