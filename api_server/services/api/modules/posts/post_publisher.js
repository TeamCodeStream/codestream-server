'use strict';

var Stream_Publisher = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_publisher');

class Post_Publisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publish_post (callback) {
		if (this.data.stream) {
			this.publish_new_stream(callback);
		}
		else {
			this.publish_post_to_stream(callback);
		}
	}

	publish_new_stream (callback) {
		// if a new stream was created, we publish the stream as needed, then leave it up to clients
		// to fetch from the stream
		new Stream_Publisher({
			stream: this.data.stream,
			data: { stream: this.data.stream },
			request_id: this.request_id,
			messager: this.messager,
			logger: this
		}).publish_stream(callback);
	}

	publish_post_to_stream (callback) {
		if (this.stream.type === 'file') {
			this.publish_post_to_team(callback);
		}
		else {
			this.publish_post_to_team_stream(callback);
		}
	}

	publish_post_to_team (callback) {
		let team_id = this.stream.team_id;
		let channel = 'team-' + team_id;
		let message = {
			post: this.data.post,
			request_id: this.request_id
		};
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish post message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	publish_post_to_team_stream (callback) {
		let stream_id = this.data.post.stream_id;
		let channel = 'stream-' + stream_id;
		let message = {
			post: this.data.post,
			request_id: this.request_id
		};
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish post message to stream ${stream_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = Post_Publisher;
