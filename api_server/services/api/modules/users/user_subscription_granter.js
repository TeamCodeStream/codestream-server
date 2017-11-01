'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class User_Subscription_Granter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grant_all (callback) {
		Bound_Async.series(this, [
			this.grant_user_channel,
			this.grant_team_channels,
			this.get_streams,
			this.grant_stream_channels
		], callback);
	}

	grant_channel (channel, callback) {
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

	grant_user_channel (callback) {
		this.grant_channel('user-' + this.user.id, callback);
	}

	grant_team_channels (callback) {
		Bound_Async.forEachLimit(
			this,
			this.user.get('team_ids') || [],
			20,
			this.grant_team_channel,
			callback
		);
	}

	grant_team_channel (team_id, callback) {
		this.grant_channel('team-' + team_id, callback);
	}

	get_streams (callback) {
		this.streams = [];
		Bound_Async.forEachLimit(
			this,
			this.user.get('team_ids') || [],
			10,
			this.get_streams_for_team,
			callback
		);
	}

	get_streams_for_team (team_id, callback) {
		let query = {
			team_id: team_id,
			member_ids: this.user.id
		};
		this.data.streams.get_by_query(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				this.streams = [...this.streams, ...streams];
				callback();
			},
			{
				database_options: {
					fields: ['_id']
				},
				no_cache: true
			}
		);
	}

	grant_stream_channels (callback) {
		Bound_Async.forEachLimit(
			this,
			this.streams,
			20,
			this.grant_stream_channel,
			callback
		);
	}

	grant_stream_channel (stream, callback) {
		this.grant_channel('stream-' + stream._id, callback);
	}
}

module.exports = User_Subscription_Granter;
