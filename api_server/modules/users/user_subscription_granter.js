// handle granting permission to a given user to subscribe to various broadcaster channels

'use strict';

const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

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
		await this.grantAllChannelsV2();
	}

	async _grantAll () {
		try {
			const userId = this.user.get('_pubnubUuid') || this.user.id;
			let ttl;
			if (this.request.request.headers['x-cs-bcast-token-ttl']) {
				ttl = parseFloat(this.request.request.headers['x-cs-bcast-token-ttl']);
				if (isNaN(ttl) || ttl <= 0 || ttl > 43200) {
					ttl = undefined;
				} else {
					this.request.log(`Setting TTL for v3 broadcast token to ${ttl}`);
				}
			}
			return await this.api.services.broadcaster.grantMultipleV3(
				userId,
				this.channels,
				{ request: this.request, ttl }
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

		// add a channel that contains the last 12 characters of the subscribe key, this ensures that
		// tokens issued against a given key will be distinct in their granted channels from tokens issued
		// against a different key, but for the same channels otherwise.
		// Basically, this technique ensures that when a client fetches a token because a key was rotated out,
		// we will give the client a new token even if all the channels they would be granted are the same.
		// It also enables us to explicitly identify the subscribe key a token was issued for (up to 12 characters),
		// since we can parse the token for authorized channels
		const subscribeKey = this.api.config.broadcastEngine.pubnub && this.api.config.broadcastEngine.pubnub.subscribeKey;
		if (subscribeKey) {
			this.channels.push(`sub-${subscribeKey.substr(-12)}`);
		}

		this.channels.push.apply(
			this.channels,
			(this.user.get('teamIds') || []).map(teamId => `team-${teamId}`)
		);

		if (this.addTeamId && !this.channels.includes(`team=${this.addTeamId}`)) {
			this.channels.push(`team-${this.addTeamId}`);
		}
		if (this.revokeTeamId) {
			const index = this.channels.indexOf(`team-${this.revokeTeamId}`);
			if (index !== -1) {
				this.channels.splice(index, 1);
			}
		}

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
			teamId: this.request.data.repos.inQuery(this.user.get('teamIds') || [])
		};
		const repos = await this.request.data.repos.getByQuery(
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
		return await this.request.data.streams.getByQuery(
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
		const objects = await this.request.data.codeErrors.getByQuery(
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
	async grantAllChannelsV2 () {
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

	// obtain a V3 PubNub Access manager issued broadcaster token, either the user's existing token,
	// if it is still valid, or a new one
	async obtainV3BroadcasterToken () {
		// get the user's current broadcaster token, and parse it for authorized channels
		let token = this.user.get('broadcasterV3Token');
		let authorizedChannels = [];
		if (token) {
			authorizedChannels = this.api.services.broadcaster.
				getAuthorizedChannelsFromToken(this.user, token, { request: this.request }) || [];
		}

		// set the channels the user should be authorized to access
		this.setChannels();

		// if they don't match, generate a new token
		let newToken = false;
		if (
			this.force || 
			!token || 
			authorizedChannels.length !== this.channels.length ||
			ArrayUtilities.difference(authorizedChannels, this.channels).length !== 0
		) {
			this.request.log(`User ${this.user.id} is being granted a new V3 broadcaster token`);
			try {
				token = await this._grantAll();
				newToken = true;
			}
			catch (error) {
				throw this.request.errorHandler.error('userMessagingGrant', { reason: error });
			}
		} 

		if (newToken) {
			// if we generated a new token, publish the new one to the user,
			// then save it, then revoke the old token
			await this.publishNewToken(token);
			await this.saveNewToken(token);
			await this.revokeOldToken();
		}

		return { token, newToken };
	}

	// we generated a new broadcaster token ... on the off-chance the user has two clients open,
	// we'll broadcast the new token on the user's me-channel ... this will allow the client that
	// did not issue this request to obtain the new token silently, FWIW
	async publishNewToken (token) {
		// send the new token to the user's me-channel
		const channel = `user-${this.user.id}`;
		const message = {
			requestId: this.request.request.id,
			setBroadcasterV3Token: token
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			this.request.warn(`Unable to publish new broadcaster V3 token to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// save the newly generated token to the user's object
	async saveNewToken (token) {
		return this.request.data.users.updateDirect(
			{ id: this.request.data.users.objectIdSafe(this.user.id) },
			{ $set: { broadcasterV3Token: token } }
		);

	}

	// revoke the user's existing token, since we replaced it with a new one
	async revokeOldToken () {
		const oldToken = this.user.get('broadcasterV3Token');
		if (oldToken) {
			await this.api.services.broadcaster.revokeToken(oldToken, { request: this.request });
		}
	}

}

module.exports = UserSubscriptionGranter;
