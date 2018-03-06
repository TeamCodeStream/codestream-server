// handle publishing a new post to the messager channel appropriate for the stream
// in which the post was created

'use strict';

var StreamPublisher = require(process.env.CS_API_TOP + '/modules/streams/stream_publisher');

class PostPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publishPost (callback) {
		if (this.data.stream && this.data.stream.type !== 'file') {
			// we created a non-file stream on-the-fly with this post, so publish the stream,
			// it will then be up to the client to fetch the post? (because they are not yet subscribed to the stream channel)
			this.publishNewStream(callback);
		}
		else {
			// publish the post to the members of the stream or the team if it is a file stream
			this.publishPostToStreamOrTeam(callback);
		}
	}

	// publish the creation of a new stream
	publishNewStream (callback) {
		// if a new stream was created, we publish the stream as needed, then leave it up to clients
		// to fetch from the stream
		new StreamPublisher({
			stream: this.data.stream,
			data: { stream: this.data.stream },
			request: this.request,
			messager: this.messager
		}).publishStream(callback);
	}

	// publish the creation of a new post to the stream it was created in
	publishPostToStreamOrTeam (callback) {
		if (this.stream.type === 'file') {
			// for file-type streams, we publish to the team that owns the stream
			this.publishPostToTeam(callback);
		}
		else {
			// for channels and direct, we publish to the stream itself
			this.publishPostToTeamStream(callback);
		}
	}

	// publish a post to a team channel
	publishPostToTeam (callback) {
		let teamId = this.stream.teamId;
		let channel = 'team-' + teamId;
		let message = {
			post: this.data.post,
			requestId: this.request.request.id
		};
		if (this.data.markers) {
			message.markers = this.data.markers;
		}
		if (this.data.markerLocations) {
			message.markerLocations = this.data.markerLocations;
		}
		if (this.data.stream) {
			message.stream = this.data.stream;
		}
		if (this.data.users) {
			message.users = this.data.users;
		}
		this.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.request.warn(`Could not publish post message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}

	publishPostToTeamStream (callback) {
		let streamId = this.stream._id;
		let channel = 'stream-' + streamId;
		let message = {
			post: this.data.post,
			requestId: this.request.request.id
		};
		this.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.request.warn(`Could not publish post message to stream ${streamId}: ${JSON.stringify(error)}`);
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

module.exports = PostPublisher;
