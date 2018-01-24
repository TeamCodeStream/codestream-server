'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RepoSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grantToUsers (callback) {
		BoundAsync.series(this, [
			this.getTokens,
			this.grantRepoChannel
		], callback);
	}

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

	getTokenForRegisteredUser (user, callback) {
		if (user.get('isRegistered')) {
			this.tokens.push(user.get('accessToken'));
		}
		process.nextTick(callback);
	}

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
				includePresence: true,
				request: this.request
			}
		);
	}
}

module.exports = RepoSubscriptionGranter;
