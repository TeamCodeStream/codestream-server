// handle publishing a new post to the broadcaster channel appropriate for the stream
// in which the post was created

'use strict';

class PostPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishPost () {
		if (this.stream.type === 'file' || this.stream.isTeamStream) {
			// for file-type streams, or team-streams (streams for which everyone on the team is a member),
			// we publish to the team that owns the stream
			const channel = `team-${this.stream.teamId}`;
			await this.publishPostToChannel(channel);
		}
		else {
			throw 'stream channels are deprecated';
			/*
			// for channels and direct, we publish to the stream itself
			const channel = `stream-${this.stream.id}`;
			await this.publishPostToChannel(channel);
			*/
		}
	}

	// publish a post to the given channel
	async publishPostToChannel (channel) {
		const message = Object.assign({}, this.data, {
			requestId: this.request.request.id
		});
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = PostPublisher;
