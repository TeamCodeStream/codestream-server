'use strict';

var StreamPublisher = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_publisher');

class PostPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publishPost (callback) {
		if (this.data.stream) {
			this.publishNewStream(callback);
		}
		else {
			this.publishPostToStream(callback);
		}
	}

	publishNewStream (callback) {
		// if a new stream was created, we publish the stream as needed, then leave it up to clients
		// to fetch from the stream
		new StreamPublisher({
			stream: this.data.stream,
			data: { stream: this.data.stream },
			requestId: this.requestId,
			messager: this.messager,
			logger: this
		}).publishStream(callback);
	}

	publishPostToStream (callback) {
		if (this.stream.type === 'file') {
			this.publishPostToTeam(callback);
		}
		else {
			this.publishPostToTeamStream(callback);
		}
	}

	publishPostToTeam (callback) {
		let teamId = this.stream.teamId;
		let channel = 'team-' + teamId;
		let message = {
			post: this.data.post,
			requestId: this.requestId
		};
		if (this.data.markers) {
			message.markers = this.data.markers;
		}
		if (this.data.markerLocations) {
			message.markerLocations = this.data.markerLocations;
		}
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish post message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	publishPostToTeamStream (callback) {
		let streamId = this.data.post.streamId;
		let channel = 'stream-' + streamId;
		let message = {
			post: this.data.post,
			requestId: this.requestId
		};
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish post message to stream ${streamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = PostPublisher;
