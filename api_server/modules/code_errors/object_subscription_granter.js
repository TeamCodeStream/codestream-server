// handles granting permission to the followers of an object to subscribe to the object's broadcaster channel

'use strict';

class ObjectSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant permission to the followers of an object to subscribe to the object channel
	async grantToFollowers () {
		await this.getUsers();			// get the followers users, since only registered users can access
		await this.getTokens();			// get the users' tokens
		await this.grantObjectChannel();	// grant the permissions
	}

	// get the users following the object
	async getUsers () {
		if (this.followers) {
			return;
		}

		const followerIds = this.followerIds || this.object.get('followerIds') || [];
		this.followers = await this.data.users.getByIds(
			followerIds,
			{
				// only need these fields
				fields: ['isRegistered', 'accessToken', 'accessTokens', 'broadcasterToken']
			}
		);
	}

	// get the access tokens for each user following the object that is registered
	async getTokens () {
		this.tokens = this.followers.reduce((tokens, user) => {
			if (user.get('isRegistered') && user.get('broadcasterToken')) {
				tokens.push(user.get('broadcasterToken'));
			}
			return tokens;
		}, []);
	}

	// grant permissions for each registered user to subscribe to the object channel
	async grantObjectChannel () {
		if (this.tokens.length === 0) {
			return;
		}
		const channel = 'object-' + this.object.id;
		const func = this.revoke ? 'revoke' : 'grant';
		try {
			await this.broadcaster[func](
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
}

module.exports = ObjectSubscriptionGranter;
