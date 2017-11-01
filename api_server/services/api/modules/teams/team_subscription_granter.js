'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Team_Subscription_Granter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grant_to_members (callback) {
		Bound_Async.series(this, [
			this.get_users,
			this.determine_registered_users,
			this.grant_team_channel
		], callback);
	}

	get_users (callback) {
		if (this.members) {
			return callback();
		}
		this.data.users.get_by_ids(
			this.team.get('member_ids') || [],
			(error, members) => {
				if (error) { return callback(error); }
				this.members = members;
				callback();
			},
			{
				database_options: {
					fields: 'is_registered',
				}
			}
		);
	}

	determine_registered_users (callback) {
		this.registered_users = [];
		Bound_Async.forEachLimit(
			this,
			this.members,
			10,
			this.determine_registered_user,
			callback
		);
	}

	determine_registered_user (user, callback) {
		if (user.get('is_registered')) {
			this.registered_users.push(user);
		}
		callback();
	}

	grant_team_channel (callback) {
		var user_ids = this.registered_users.map(user => user.id);
		if (user_ids.length === 0) {
			return callback();
		}
		let channel = 'team-' + this.team.id;
		this.messager.grant(
			user_ids,
			channel,
			(error) => {
				if (error) {
					 return callback(`unable to grant permissions for subscription (${channel}): ${error}`);
				}
				else {
					return callback();
				}
			}
		);
	}
}

module.exports = Team_Subscription_Granter;
