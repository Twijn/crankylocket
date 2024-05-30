const {Setting} = require("../schemas");

let settings = null;

/**
 * 
 * @returns {Promise<{wheelCss:string,reactionCss:string,reactionSetting:"wisp"|"emote",wheelSetting:"block"|"remove"|"ignore",emoteRequirements:{emoteCount:number,emoteTime:number,maxPerUser:number,lastingTime:number}}>}
 */
const get = async () => {
    if (settings) {
        return settings;
    }

    settings = await Setting.findOne({});
    if (!settings) {
        settings = await Setting.create({});
    }
    
    return settings;
}

const save = async () => {
    if (!settings) return;

    await settings.save();
    settings = null;
}

module.exports = {
    get,
    save,
};
