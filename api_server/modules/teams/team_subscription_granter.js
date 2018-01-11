'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TeamSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grantToMembers (callback) {
		BoundAsync.series(this, [
			this.getUsers,
			this.getTokens,
			this.grantTeamChannel
		], callback);
	}

	getUsers (callback) {
		if (this.members) {
			return callback();
		}
		this.data.users.getByIds(
			this.team.get('memberIds') || [],
			(error, members) => {
				if (error) { return callback(error); }
				this.members = members;
				callback();
			},
			{
				fields: ['isRegistered', 'accessToken']
			}
		);
	}

	getTokens (callback) {
		this.tokens = [];
		BoundAsync.forEachLimit(
			this,
			this.members,
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

	grantTeamChannel (callback) {
		if (this.tokens.length === 0) {
			return callback();
		}
		let channel = 'team-' + this.team.id;
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
				includePresence: true
			}
		);
	}
}

module.exports = TeamSubscriptionGranter;
