// handle granting permission to a given user to subscribe to various messager channels

'use strict';

const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

class UserSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant all permissions necessary
	async grantAll () {
		await this.grantUserChannel();	// their own me-channel
		await this.grantTeamChannels();	// team channel for teams they are a member of
		await this.getRepos();			// get the repos owned by those teams
		await this.grantRepoChannels();	// repo channel for each repo owned by the teams they are a member of
		await this.getStreams();		// get the streams from those teams/repos
		await this.grantStreamChannels();	// stream channel for direct/channel streams they are a member of
	}

	// grant permission for the user to subscribe to their own me-channel
	async grantUserChannel () {
		await this.grantChannel('user-' + this.user.id);
	}

	// grant permission for the user to subscribe to the team channel for teams
	// they are a member of
	async grantTeamChannels () {
		const teamIds = this.user.get('teamIds') || [];
		await Promise.all(teamIds.map(async teamId => {
			await this.grantTeamChannel(teamId);
		}));
	}

	// grant permission for the user to subscribe to a given team channel
	async grantTeamChannel (teamId) {
		// note - team channels are presence aware
		await this.grantChannel('team-' + teamId, { includePresence: true });
	}

	// get the repos owned by the teams the user is a member of
	async getRepos () {
		if ((this.user.get('teamIds') || []).length === 0) {
			this.repos = [];
			return;
		}
		const query = {
			teamId: this.data.repos.inQuery(this.user.get('teamIds') || [])
		};
		this.repos = await this.data.repos.getByQuery(
			query,
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
	async grantRepoChannels () {
		await Promise.all(this.repos.map(async repo => {
			await this.grantRepoChannel(repo);
		}));
	}

	// grant permission for the user to subscribe to a given repo channel
	async grantRepoChannel (repo) {
		// note - repo channels are presence aware
		await this.grantChannel('repo-' + repo._id, { includePresence: true });
	}

	// get the streams owned by each team the user is a member of ... this is
	// restricted to direct and channel streams, since file-type streams are
	// public to the whole team and do not have their own channel
	async getStreams () {
		this.streams = [];
		const teamIds = this.user.get('teamIds') || [];
		await Promise.all(teamIds.map(async teamId => {
			await this.getStreamsForTeam(teamId);
		}));
	}

	// get the streams owned by a given team ... this is restricted to direct
	// and channel streams, since file-type streams are public to the whole team
	// and do not have their own channel
	async getStreamsForTeam (teamId) {
		const query = {
			teamId: teamId,
			memberIds: this.user.id	// current user must be a member
		};
		const streams = await this.data.streams.getByQuery(
			query,
			{
				databaseOptions: {
					fields: ['_id'],
					hint: StreamIndexes.byMembers
				},
				noCache: true
			}
		);
		this.streams = [...this.streams, ...streams];
	}

	// grant permission for the user to subscribe to the stream channel for streams
	// they are a member of
	async grantStreamChannels () {
		await Promise.all(this.streams.map(async stream => {
			await this.grantStreamChannel(stream);
		}));
	}

	// grant permission for the user to subscribe to a given stream channel
	async grantStreamChannel (stream) {
		await this.grantChannel('stream-' + stream._id);
	}

	// grant permission for the user to subscribe to a given channel
	async grantChannel (channel, options = {}) {
		try {
			await this.messager.grant(
				this.user.getAccessToken(),
				channel,
				{
					request: this.request,
					includePresence: options.includePresence
				}
			);
		}
		catch (error) {
			throw `unable to grant permissions for subscription (${channel}): ${error}`;
		}
	}
}

module.exports = UserSubscriptionGranter;
