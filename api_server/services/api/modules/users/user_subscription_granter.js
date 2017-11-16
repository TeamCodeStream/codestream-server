'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UserSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grantAll (callback) {
		BoundAsync.series(this, [
			this.grantUserChannel,
			this.grantTeamChannels,
			this.getStreams,
			this.grantStreamChannels
		], callback);
	}

	grantChannel (channel, callback) {
		this.messager.grant(
			this.user.id,
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

	grantUserChannel (callback) {
		this.grantChannel('user-' + this.user.id, callback);
	}

	grantTeamChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.user.get('teamIds') || [],
			20,
			this.grantTeamChannel,
			callback
		);
	}

	grantTeamChannel (teamId, callback) {
		this.grantChannel('team-' + teamId, callback);
	}

	getStreams (callback) {
		this.streams = [];
		BoundAsync.forEachLimit(
			this,
			this.user.get('teamIds') || [],
			10,
			this.getStreamsForTeam,
			callback
		);
	}

	getStreamsForTeam (teamId, callback) {
		let query = {
			teamId: teamId,
			memberIds: this.user.id
		};
		this.data.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				this.streams = [...this.streams, ...streams];
				callback();
			},
			{
				databaseOptions: {
					fields: ['_id']
				},
				noCache: true
			}
		);
	}

	grantStreamChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.streams,
			20,
			this.grantStreamChannel,
			callback
		);
	}

	grantStreamChannel (stream, callback) {
		this.grantChannel('stream-' + stream._id, callback);
	}
}

module.exports = UserSubscriptionGranter;
