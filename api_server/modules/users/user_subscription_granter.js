// handle granting permission to a given user to subscribe to various messager channels

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

class UserSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant all permissions necessary
	grantAll (callback) {
		BoundAsync.series(this, [
			this.grantUserChannel,	// their own me-channel
			this.grantTeamChannels,	// team channel for teams they are a member of
			this.getRepos,			// get the repos owned by those teams
			this.grantRepoChannels,	// repo channel for each repo owned by the teams they are a member of
			this.getStreams,		// get the streams from those teams/repos
			this.grantStreamChannels	// stream channel for direct/channel streams they are a member of
		], callback);
	}

	// grant permission for the user to subscribe to their own me-channel
	grantUserChannel (callback) {
		this.grantChannel('user-' + this.user.id, callback);
	}

	// grant permission for the user to subscribe to the team channel for teams
	// they are a member of
	grantTeamChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.user.get('teamIds') || [],
			20,
			this.grantTeamChannel,
			callback
		);
	}

	// grant permission for the user to subscribe to a given team channel
	grantTeamChannel (teamId, callback) {
		// note - team channels are presence aware
		this.grantChannel('team-' + teamId, callback, { includePresence: true });
	}

	// get the repos owned by the teams the user is a member of
	getRepos (callback) {
		if ((this.user.get('teamIds') || []).length === 0) {
			this.repos = [];
			return callback();
		}
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

	// grant permission for the user to subscribe to the repo channel for repos
	// owned by teams they are a member of
	grantRepoChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.repos,
			20,
			this.grantRepoChannel,
			callback
		);
	}

	// grant permission for the user to subscribe to a given repo channel
	grantRepoChannel (repo, callback) {
		// note - repo channels are presence aware
		this.grantChannel('repo-' + repo._id, callback, { includePresence: true });
	}

	// get the streams owned by each team the user is a member of ... this is
	// restricted to direct and channel streams, since file-type streams are
	// public to the whole team and do not have their own channel
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

	// get the streams owned by a given team ... this is restricted to direct
	// and channel streams, since file-type streams are public to the whole team
	// and do not have their own channel
	getStreamsForTeam (teamId, callback) {
		let query = {
			teamId: teamId,
			memberIds: this.user.id	// current user must be a member
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

	// grant permission for the user to subscribe to the stream channel for streams
	// they are a member of
	grantStreamChannels (callback) {
		BoundAsync.forEachLimit(
			this,
			this.streams,
			20,
			this.grantStreamChannel,
			callback
		);
	}

	// grant permission for the user to subscribe to a given stream channel
	grantStreamChannel (stream, callback) {
		this.grantChannel('stream-' + stream._id, callback);
	}

	// grant permission for the user to subscribe to a given channel
	grantChannel (channel, callback, options = {}) {
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
				request: this.request,
				includePresence: options.includePresence
			}
		);
	}
}

module.exports = UserSubscriptionGranter;
