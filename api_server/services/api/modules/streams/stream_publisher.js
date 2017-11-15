'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Stream_Publisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish a stream ... how we do it depends on its type
	publish_stream (callback) {
		if (this.stream.type === 'file') {
			this.publish_stream_to_team(callback);
		}
		else {
			this.publish_stream_to_members(callback);
		}
	}

	// publish a file-type stream to the team that owns it
	publish_stream_to_team (callback) {
		let team_id = this.stream.team_id;
		let channel = 'team-' + team_id;
		let message = Object.assign({}, this.data, { request_id: this.request_id });
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish new stream message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	// publish a new channel or direct type stream to its members
	publish_stream_to_members (callback) {
		Bound_Async.forEachLimit(
			this,
			this.stream.member_ids,
			10,
			this.publish_stream_to_user,
			callback
		);
	}

	// publish a new channel or direct type stream to one of its members
	publish_stream_to_user (user_id, callback) {
		let channel = 'user-' + user_id;
		let message = Object.assign({}, this.data, { request_id: this.request_id });
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish new stream message to user ${user_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = Stream_Publisher;
