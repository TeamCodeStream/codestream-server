// handle the "PUT /grant/:channel" request to explicitly grant access to particular
// messager channels ... this is a failsafe initiated by the client when subscription
// to a partciular channel is failing

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Errors = require('./errors');

class GrantRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// allow for now, ACL will be in the particular grant
	}

	async process () {
		const channel = this.request.params.channel;
		if (channel.startsWith('user-')) {
			await this.grantUserChannel();
		}
		else if (channel.startsWith('team-')) {
			await this.grantTeamChannel();
		}
		else if (channel.startsWith('repo-')) {
			await this.grantRepoChannel();
		}
		else if (channel.startsWith('stream-')) {
			await this.grantStreamChannel();
		}
		else {
			throw this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel });
		}
	}

	// grant permission to subscribe to a user channel
	async grantUserChannel () {
		// user can only subscribe to their own me-channel
		const channel = this.request.params.channel.toLowerCase();
		if (channel !== `user-${this.user.id}`) {
			throw this.errorHandler.error('readAuth');
		}
		await this.grantChannel(channel);
	}

	// grant permission to subscribe to a team channel
	async grantTeamChannel () {
		// user can only subscribe to the team channel for teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^team-(.*)/);
		if (!match || match.length < 2) {
			throw this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel });
		}
		const teamId = match[1];
		const authorized = await this.user.authorizeTeam(teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('readAuth');
		}
		await this.grantChannel(channel);
	}

	// grant permission to subscribe to a repo channel
	async grantRepoChannel () {
		// user can only subscribe to the repo channel for repos owned by teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^repo-(.*)/);
		if (!match || match.length < 2) {
			throw this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel });
		}
		const repoId = match[1];
		let authorized;
		try {
			authorized = await this.user.authorizeRepo(repoId, this);
		}
		catch (error) {
			throw this.errorHandler.error('readAuth');
		}
		if (!authorized) {
			throw this.errorHandler.error('readAuth');
		}
		await this.grantChannel(channel);
	}

	// grant permission to access a stream channel
	async grantStreamChannel () {
		// user can only subscribe to the stream channel for streams owned by teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^stream-(.*)/);
		if (!match || match.length < 2) {
			throw this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel });
		}
		const streamId = match[1];
		let authorized;
		try {
			authorized = await this.user.authorizeStream(streamId, this);
		}
		catch (error) {
			throw this.errorHandler.error('readAuth');
		}
		if (!authorized) {
			throw this.errorHandler.error('readAuth');
		}
		await this.grantChannel(channel);
	}

	// grant permission to subscribe to a given channel, assuming ACL has already been handled
	async grantChannel (channel) {
		// team and repo channels have presence awareness
		const includePresence = channel.startsWith('team-') || channel.startsWith('repo-');
		const tokens = [];
		// using the access token for PubNub subscription is to be DEPRECATED
		if (this.user.get('isRegistered')) {
			tokens.push(this.user.getAccessToken());
		}
		if (this.user.get('pubNubToken')) {
			tokens.push(this.user.get('pubNubToken'));
		}
		try {
			await this.api.services.messager.grant(
				tokens,
				channel,
				{
					request: this,
					includePresence: includePresence
				}
			);
		}
		catch (error) {
			throw this.errorHandler.error('generalMessagingGrant');
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'grant',
			summary: 'Explicitly ask the server to grant subscription access to a particular PubNub channel',
			access: 'Current user must have permission to subscribe to the requested channel. For team channels, the user must be on the team. For repo channels, the user must be on the team that owns the repo. For stream channels, the user must be in the stream. For user channels, the channel must match the current user.',
			description: 'In cases where a PubNub subscription has failed, call this function to explicitly make sure the user can subscribe to this channel. If the call succeeds, the client can assume the user has been granted access.',
			input: 'Specify the channel to grant access to in the path',
			returns: 'Empty object',
			errors: [
				'invalidGrantChannel',
				'readAuth',
				'generalMessagingGrant'
			]
		};
	}
}

module.exports = GrantRequest;
