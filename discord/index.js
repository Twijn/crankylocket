const { Client, Events, GatewayIntentBits } = require('discord.js');
const { DiscordRole } = require('../schemas');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Discord ready! Logged in as ${readyClient.user.tag}`);

	const currentDate = Date.now();
	client.guilds.fetch({}).then(guilds => {
		for (let [guildId, oauthGuild] of guilds) {
			oauthGuild.fetch().then(async guild => {
				const botRole = guild.roles.botRoleFor(client.user.id);
				if (!botRole) {
					console.error("Unable to get bot role. All roles will be marked as unassignable.");
				}
				const roles = await guild.roles.fetch();
				for (let [roleId, role] of roles) {
					if (role.managed) continue;
					if (role.name === "@everyone") continue;

					let newData = {
						guild: guildId,
						name: role.name,
						color: role.hexColor,
						lastSeen: currentDate,
						position: role.position,
						assignable: false,
					};

					if (botRole && botRole.position > role.position) {
						newData.assignable = true;
					}

					await DiscordRole.findByIdAndUpdate(roleId, newData, {
						upsert: true,
						new: true,
					});
				}
				await DiscordRole.deleteMany({
					guild: guildId,
					lastSeen: {
						$lt: currentDate
					},
				});
			}, console.error);
		}
	}, console.error);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
