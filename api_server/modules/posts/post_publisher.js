// handle publishing a new post to the messager channel appropriate for the stream
// in which the post was created

'use strict';

const StreamPublisher = require(process.env.CS_API_TOP + '/modules/streams/stream_publisher');

class PostPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	async publishPost () {
		// first publish any new streams, this is only for private streams not visible to the whole team
		await this.publishNewStreams();

		if (this.data.stream && this.data.stream.type !== 'file' && !this.data.stream.isTeamStream) {
			// we create a new stream on-the-fly, and it's not visible to the team, so we publish
			// to the individual members
			await this.publishNewStream();
		}
		else {
			// publish the post to the members of the stream or the team, depending on whether the 
			// stream is accessible to the whole team (a file-type stream or a team stream)
			await this.publishPostToStreamOrTeam();
		}
	}

	// publish any streams created on-the-fly when creating this post,
	// this is only for private streams not visible to the whole team
	async publishNewStreams () {
		const streams = this.data.streams || [];
		await Promise.all(streams.map(async stream => {
			if (stream.type !== 'file' && !stream.isTeamStream) {
				// we created a non-file stream on-the-fly with this post, so publish the stream,
				// it will then be up to the client to fetch the post? (because they are not yet subscribed to the stream channel)
				await this.publishNewStream(stream);
			}
		}));
	}

	// publish the creation of a new stream
	async publishNewStream (stream) {
		// if a new stream was created, we publish the stream as needed, then leave it up to clients
		// to fetch from the stream
		await new StreamPublisher({
			stream: stream,
			data: { stream },
			request: this.request,
			messager: this.messager,
			isNew: true
		}).publishStream();
	}

	// publish the creation of a new post to the stream it was created in
	async publishPostToStreamOrTeam () {
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
