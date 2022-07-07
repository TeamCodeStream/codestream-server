// handle granting permission to a given user to subscribe to various broadcaster channels

'use strict';

// const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
// const StreamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');

class UserSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant all permissions necessary for PubNub's V2 Access Manager
	// (this method should be deprecated when we have fully moved to the V3 Access Manager)
	async grantAllV2 () {
		if (!this.user.get('broadcasterToken')) {
			throw `no broadcaster token available for user ${this.user.id}`;
		}

		this.setChannels();
		//await this.getRepoChannels();			
		//await this.getStreamChannels();		
		//await this.getObjectChannels();
		await this.grantAllChannels();
	}

	// grant all permissions necessary for PubNub's V3 Access Manager
	async grantAll () {
		this.setChannels();

		try {
			return await this.api.services.broadcaster.grantMultipleV3(
				this.user.id,
				this.channels,
				{ request: this.request }
			);
		}
		catch (error) {
			throw `unable to grant user permissions for subscriptions, userId ${this.user.id}: ${error}`;
		}
	}

	setChannels () {
		this.channels = [
			`user-${this.user.id}`
		];
		this.channels.push.apply(
			this.channels,
			(this.user.get('teamIds') || []).map(teamId => {
				return { name: `team-${teamId}` };
			})
		);

		if (this.api.config.sharedGeneral.isOnPrem) {
			// for on-prem, grant special channel for test "echoes"
			this.channels.push({
				name: 'echo'
			});
		}
	}

	/*
	// get the repos owned by the teams the user is a member of
	async getRepoChannels () {
		if ((this.user.get('teamIds') || []).length === 0) {
			this.repos = [];
			return;
		}
		const query = {
			teamId: this.data.repos.inQuery(this.user.get('teamIds') || [])
		};
		const repos = await this.data.repos.getByQuery(
			query,
			{
				fields: ['id'],
				hint: RepoIndexes.byTeamId,
				noCache: true
			}
		);
		for (let repo of repos) {
			this.channels.push({
				name: `repo-${repo.id}`,
				includePresence: true
			});
		}
	}

	// get the streams owned by each team the user is a member of ... this is
	// restricted to direct and channel streams, since file-type streams are
	// public to the whole team and do not have their own channel
	async getStreamChannels () {
		let streams = [];
		const teamIds = this.user.get('teamIds') || [];
		await Promise.all(teamIds.map(async teamId => {
			const streamsForTeam = await this.getStreamsForTeam(teamId);
			streams = [...streams, ...streamsForTeam];
		}));

		for (let stream of streams) {
			this.channels.push(`stream-${stream.id}`);
		}
	}
	
	// get the streams owned by a given team ... this is restricted to direct
	// and channel streams, since file-type streams are public to the whole team
	// and do not have their own channel
	async getStreamsForTeam (teamId) {
		const query = {
			teamId: teamId,
			memberIds: this.user.id	// current user must be a member
		};
		return await this.data.streams.getByQuery(
			query,
			{
				fields: ['id'],
				hint: StreamIndexes.byMembers,
				noCache: true
			}
		);
	}
	*/

	/*
	// get channels for all objects the user is are following
	async getObjectChannels () {
		const objects = await this.data.codeErrors.getByQuery(
			{ followerIds: this.user.id },
			{
				fields: ['id'],
				hint: CodeErrorIndexes.byFollowerIds,
				noCache: true
			}
		);
		this.channels.push.apply(
			this.channels,
			objects.map(o => { 
				return { name: `object-${o.id}` };
			})
		);
	}
	*/
	
	// grant permission for the user to subscribe to a given set of channel
	async grantAllChannels () {
		try {
			await this.api.services.broadcaster.grantMultiple(
				this.user.get('broadcasterToken'),
				this.channels,
				{ request: this.request }
			);
		}
		catch (error) {
			throw `unable to grant user permissions for subscriptions, userId ${this.user.id}: ${error}`;
		}
	}
}

module.exports = UserSubscriptionGranter;
