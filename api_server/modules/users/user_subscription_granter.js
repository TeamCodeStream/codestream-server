'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

class UserSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	grantAll (callback) {
		BoundAsync.series(this, [
			this.grantUserChannel,
			this.grantTeamChannels,
			this.getRepos,
			this.grantRepoChannels,
			this.getStreams,
			this.grantStreamChannels
		], callback);
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

	getRepos (callback) {
		let query = {
			teamId: this.data.repos.inQuery(this.user.get('teamIds') || [])
		};
		this.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				this.repos = repos;
				callback();
			},
			{
				databaseOptions: {
					fields: ['_id'],
					hint: RepoIndexes.byTeamId
				},
				noCache: true
			}
		);
	}

	grantRepoChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.repos,
			20,
			this.grantRepoChannel,
			callback
		);
	}

	grantRepoChannel (repo, callback) {
		this.grantChannel('repo-' + repo._id, callback);
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
					fields: ['_id'],
					hint: StreamIndexes.byMemberIds
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

	grantChannel (channel, callback) {
		this.messager.grant(
			this.user.get('accessToken'),
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
				request: this.request
			}
		);
	}
}

module.exports = UserSubscriptionGranter;
