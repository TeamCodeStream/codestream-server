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
			const channel = `team-${this.stream.teamId}`;
			await this.publishPostToChannel(channel);
		}
		else {
			// for channels and direct, we publish to the stream itself
			const channel = `stream-${this.stream._id}`;
			await this.publishPostToChannel(channel);

			// since the post went to a private stream, if there are any repos affected,
			// we need to publish that info to the whole team
			await this.publishReposToTeam();
		}
	}

	// publish a post to the given channel
	async publishPostToChannel (channel) {
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
			this.request.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`);
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
