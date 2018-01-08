'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class StreamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish a stream ... how we do it depends on its type
	publishStream (callback) {
		if (this.stream.type === 'file') {
			this.publishStreamToTeam(callback);
		}
		else {
			this.publishStreamToMembers(callback);
		}
	}

	// publish a file-type stream to the team that owns it
	publishStreamToTeam (callback) {
		let teamId = this.stream.teamId;
		let channel = 'team-' + teamId;
		let message = Object.assign({}, this.data, { requestId: this.request.request.id });
		this.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.request.warn(`Could not publish new stream message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	// publish a new channel or direct type stream to its members
	publishStreamToMembers (callback) {
		BoundAsync.forEachLimit(
			this,
			this.stream.memberIds,
			10,
			this.publishStreamToUser,
			callback
		);
	}

	// publish a new channel or direct type stream to one of its members
	publishStreamToUser (userId, callback) {
		let channel = 'user-' + userId;
		let message = Object.assign({}, this.data, { requestId: this.request.request.id });
		this.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.request.warn(`Could not publish new stream message to user ${userId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}
}

module.exports = StreamPublisher;
