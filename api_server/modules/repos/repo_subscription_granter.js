// handle granting permission for users to subscribe to the messager channel for a repo

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RepoSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant subscription permission to all indicated users to subscribe to the repo channel for this repo
	grantToUsers (callback) {
		BoundAsync.series(this, [
			this.getTokens,		// get the access tokens for each registered user
			this.grantRepoChannel	// grant subscription permissions for all of these user
		], callback);
	}

	// get access tokens for each registered user
	getTokens (callback) {
		this.tokens = [];
		BoundAsync.forEachLimit(
			this,
			this.users,
			10,
			this.getTokenForRegisteredUser,
			callback
		);
	}

	// get an access token for a single user, only registered users can have access tokens
	getTokenForRegisteredUser (user, callback) {
		if (user.get('isRegistered')) {
			this.tokens.push(user.get('accessToken'));
		}
		process.nextTick(callback);
	}

	// grant permission to all the indicated users to subscribe to the repo channel
	grantRepoChannel (callback) {
		if (this.tokens.length === 0) {
			return callback();
		}
		let channel = 'repo-' + this.repo.id;
		this.messager.grant(
			this.tokens,
			channel,
			(error) => {
				if (error) {
					return callback(`unable to grant permissions for subscription (${channel}): ${error}`);
				}
				else {
					return callback();
				}
			},
			{
				includePresence: true,	// we listen to "per-repo" presence
				request: this.request
			}
		);
	}
}

module.exports = RepoSubscriptionGranter;
