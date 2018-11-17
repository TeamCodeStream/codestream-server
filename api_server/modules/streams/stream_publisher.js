// handle publishing a new stream to the messager channel appropriate for the stream

'use strict';

class StreamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish a stream ... how we do it depends on its privacy setting
	async publishStream () {
		if (this.stream.privacy === 'public') {
			// public streams - which include file-type streams, team-streams (streams for which everyone
			// on the team is automatically a member), and explicitly public channels - 
			// are published to the team that owns the repo that owns the stream
			await this.publishStreamToTeam();
		}
		else if (this.isNew) {
			// newly created streams, which are private channels or direct streams,
			// are published to the individual members of the stream, since the members won't be 
			// subscribed to a stream channel just yet
			await this.publishStreamToMembers();
		}
		else {
			// updated private streams (explicitly private channels, or direct streams) are
			// published to the stream channel
			await this.publishStreamToStream();
		}
	}

	// publish a public stream to the team that owns it
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
		this.publishStreamToUsers(this.stream.memberIds);
	}

	// publish a stream to given users
	async publishStreamToUsers (userIds) {
		await Promise.all(userIds.map(async userId => {
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

	// publish a private updated (not newly created) stream to the members of the stream
	async publishStreamToStream () {
		const channel = 'stream-' + this.stream.id;
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
			this.request.warn(`Could not publish stream message to stream ${this.stream.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = StreamPublisher;
