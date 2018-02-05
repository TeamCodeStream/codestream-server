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

	grantUserChannel (callback) {
		const channel = this.request.params.channel.toLowerCase();
		if (channel !== `user-${this.user.id}`) {
			return callback(this.errorHandler.error('readAuth'));
		}
		this.grantChannel(channel, callback);
	}

	grantTeamChannel (callback) {
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

	grantRepoChannel (callback) {
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

	grantStreamChannel (callback) {
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

	grantChannel (channel, callback) {
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
