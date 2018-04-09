// handle granting permission for users to subscribe to the messager channel for a repo

'use strict';

class RepoSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant subscription permission to all indicated users to subscribe to the repo channel for this repo
	async grantToUsers () {
		await this.getTokens();			// get the access tokens for each registered user
		await this.grantRepoChannel();	// grant subscription permissions for all of these user
	}

	// get access tokens for each registered user
	async getTokens () {
		this.tokens = this.users.reduce((tokens, user) => {
			if (user.get('isRegistered')) {
				tokens.push(user.get('accessToken'));
			}
			return tokens;
		}, []);
	}

	// grant permission to all the indicated users to subscribe to the repo channel
	async grantRepoChannel () {
		if (this.tokens.length === 0) {
			return;
		}
		const channel = 'repo-' + this.repo.id;
		try {
			await this.messager.grant(
				this.tokens,
				channel,
				{
					includePresence: true,	// we listen to "per-repo" presence
					request: this.request
				}
			);
		}
		catch (error) {
			throw `unable to grant permissions for subscription (${channel}): ${error}`;
		}
	}
}

module.exports = RepoSubscriptionGranter;
