// handle publishing a new stream to the messager channel appropriate for the stream

'use strict';

class StreamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish a stream ... how we do it depends on its type
	async publishStream () {
		if (this.stream.type === 'file') {
			// file-type streams are published to the team that owns the repo that owns the stream
			await this.publishStreamToTeam();
		}
		else {
			// channel and direct streams are published to the individual members of the stream
			await this.publishStreamToMembers();
		}
	}

	// publish a file-type stream to the team that owns it
	async publishStreamToTeam () {
		const teamId = this.stream.teamId;
		const channel = 'team-' + teamId;
		const message = Object.assign({}, this.data, { requestId: this.request.request.id });
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish new stream message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish a new channel or direct type stream to its members
	async publishStreamToMembers () {
		await Promise.all(this.stream.memberIds.map(async userId => {
			await this.publishStreamToUser(userId);
		}));
	}

	// publish a new channel or direct type stream to one of its members
	async publishStreamToUser (userId) {
		const channel = 'user-' + userId;
		const message = Object.assign({}, this.data, { requestId: this.request.request.id });
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish new stream message to user ${userId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = StreamPublisher;
