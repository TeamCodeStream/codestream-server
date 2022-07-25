// handles granting permission to the users in a team to subscribe to the team's broadcaster channel

'use strict';

const UserSubscriptionGranter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_subscription_granter');

class TeamSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant permission to the users of a team to subscribe to the team channel
	async grantToMembers () {
		await this.getUsers();			// get the stream users, since only registered users can access
		await this.getTokens();			// get the users' tokens
		await this.grantTeamChannel();	// grant the permissions
		await this.grantV3TeamPermissions(); // grant permissions for V3 PubNub Access Manager tokens
	}

	// get the users in a team
	async getUsers () {
		if (this.members) {
			return;
		}
		this.members = await this.request.data.users.getByIds(
			this.team.getActiveMembers(),
			{
				// only need these fields
				fields: ['isRegistered', 'accessToken', 'accessTokens', 'broadcasterToken', 'broadcasterV3Token']
			}
		);
	}

	// get the access tokens for each user in the team that is registered
	async getTokens () {
		this.tokens = this.members.reduce((tokens, user) => {
			if (user.get('broadcasterToken')) {
				tokens.push(user.get('broadcasterToken'));
			}
			return tokens;
		}, []);
	}

	// grant permissions for each registered user to subscribe to the team channel
	async grantTeamChannel () {
		if (this.tokens.length === 0) {
			return;
		}
		const channel = 'team-' + this.team.id;
		const func = this.revoke ? 'revoke' : 'grant';
		try {
			await this.api.services.broadcaster[func](
				this.tokens,
				channel,
				{
					//includePresence: true,
					request: this.request
				}
			);
		}
		catch (error) {
			throw `unable to ${func} permissions for subscription (${channel}): ${error}`;
		}
	}

	// grant permissions for V3 PubNub Access Manager tokens
	async grantV3TeamPermissions () {
		return Promise.all(this.members.map(async user => {
			const grantOptions = {
				api: this.api,
				user: user,
				request: this.request
			};
			if (this.revoke) {
				grantOptions.revokeTeamId = this.team.id;
			} else {
				grantOptions.addTeamId = this.team.id;
			}
			await new UserSubscriptionGranter(grantOptions).obtainV3BroadcasterToken();
		}));
	}
}

module.exports = TeamSubscriptionGranter;
