// handle the "PUT /grant/:channel" request to explicitly grant access to particular
// messager channels ... this is a failsafe initiated by the client when subscription
// to a partciular channel is failing

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Errors = require('./errors');

class GrantRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	authorize (callback) {
		callback();	// allow for now, ACL will be in the particular grant
	}

	process (callback) {
		const channel = this.request.params.channel;
		if (channel.startsWith('user-')) {
			this.grantUserChannel(callback);
		}
		else if (channel.startsWith('team-')) {
			this.grantTeamChannel(callback);
		}
		else if (channel.startsWith('repo-')) {
			this.grantRepoChannel(callback);
		}
		else if (channel.startsWith('stream-')) {
			this.grantStreamChannel(callback);
		}
		else {
			return callback(this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel }));
		}
	}

	// grant permission to subscribe to a user channel
	grantUserChannel (callback) {
		// user can only subscribe to their own me-channel
		const channel = this.request.params.channel.toLowerCase();
		if (channel !== `user-${this.user.id}`) {
			return callback(this.errorHandler.error('readAuth'));
		}
		this.grantChannel(channel, callback);
	}

	// grant permission to subscribe to a team channel
	grantTeamChannel (callback) {
		// user can only subscribe to the team channel for teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^team-(.*)/);
		if (!match || match.length < 2) {
			return callback(this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel }));
		}
		const teamId = match[1];
		this.user.authorizeTeam(teamId, this, (error, authorized) => {
			if (error) { return callback(error); }
			if (!authorized) {
				return callback(this.errorHandler.error('readAuth'));
			}
			this.grantChannel(channel, callback);
		});
	}

	// grant permission to subscribe to a repo channel
	grantRepoChannel (callback) {
		// user can only subscribe to the repo channel for repos owned by teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^repo-(.*)/);
		if (!match || match.length < 2) {
			return callback(this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel }));
		}
		const repoId = match[1];
		this.user.authorizeRepo(repoId, this, (error, authorized) => {
			if (error || !authorized) {
				return callback(this.errorHandler.error('readAuth'));
			}
			this.grantChannel(channel, callback);
		});
	}

	// grant permission to access a stream channel
	grantStreamChannel (callback) {
		// user can only subscribe to the stream channel for streams owned by teams they are a member of
		const channel = this.request.params.channel.toLowerCase();
		const match = channel.match(/^stream-(.*)/);
		if (!match || match.length < 2) {
			return callback(this.errorHandler.error('invalidGrantChannel', { info: this.request.params.channel }));
		}
		const streamId = match[1];
		this.user.authorizeStream(streamId, this, (error, authorized) => {
			if (error || !authorized) {
				return callback(this.errorHandler.error('readAuth'));
			}
			this.grantChannel(channel, callback);
		});
	}

	// grant permission to subscribe to a given channel, assuming ACL has already been handled
	grantChannel (channel, callback) {
		// team and repo channels have presence awareness
		const includePresence = channel.startsWith('team-') || channel.startsWith('repo-');
		this.api.services.messager.grant(
			this.user.get('accessToken'),
			channel,
			(error) => {
				if (error) {
					return callback(this.errorHandler.error('messagingGrant'));
				}
				else {
					return callback();
				}
			},
			{
				request: this,
				includePresence: includePresence
			}
		);
	}
}

module.exports = GrantRequest;
