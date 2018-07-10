// handle publishing a new post to the messager channel appropriate for the stream
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
			await this.publishPostToTeam();
		}
		else {
			// for channels and direct, we publish to the stream itself
			await this.publishPostToStream();

			// since the post went to a private stream, if there are any repos affected,
			// we need to publish that info to the whole team
			await this.publishReposToTeam();
		}
	}

	// publish a post to a team channel
	async publishPostToTeam () {
		const teamId = this.stream.teamId;
		const channel = 'team-' + teamId;
		const message = {
			post: this.data.post,
			requestId: this.request.request.id
		};
		['markers', 'markerLocations', 'streams', 'users', 'repos'].forEach(type => {
			if (this.data[type]) {
				message[type] = this.data[type];
			}
		});
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish a post to a stream channel
	async publishPostToStream () {
		const streamId = this.stream._id;
		const channel = 'stream-' + streamId;
		const message = {
			post: this.data.post,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post message to stream ${streamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish any affected repo info to the team
	async publishReposToTeam () {
		if (!this.data.repos) {
			return;
		}
		const teamId = this.stream.teamId;
		const channel = 'team-' + teamId;
		const message = {
			repos: this.data.repos,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish repos message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = PostPublisher;
