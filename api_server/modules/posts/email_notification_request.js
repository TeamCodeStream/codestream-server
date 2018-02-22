'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const EmailNotificationSender = require('./email_notification_sender');
const Indexes = require('./indexes');
const EmailNotificationQueue = require('./email_notification_queue');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class EmailNotificationRequest extends RestfulRequest {

	authorize (callback) {
		// this is a "faux" request, not initiated by a user at all, so it is
		// fully safe to authorize
		return callback();
	}

	process (callback) {
		this.log(`Processing an email notification request: ${JSON.stringify(this.message)}`);
		BoundAsync.series(this, [
			this.getStream,
			this.sendEmails,
			this.getNextPost,
			this.triggerNextTimer,
			this.updateStreamSeqNum
		], error => {
			if (error && error !== true) {
				this.warn('Email notification handling failed: ' + JSON.stringify(error));
			}
			callback();
		});
	}

	getStream (callback) {
		this.data.streams.getById(
			this.message.streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				callback();
			}
		);
	}

	sendEmails (callback) {
		if (this.stream.get('emailNotificationSeqNum') !== this.message.seqNum) {
			// we only do email notifications if our seqNum (the sequence number of the post
			// that triggered the interval timer and ultimately this call) matches the one
			// stored with the stream ... if it doesn't match, we assume another interval
			// timer has been set up with the proper seqNum (fingers crossed)
			return callback(true);	// short-circuit the flow
		}
		new EmailNotificationSender({
			request: this,
			stream: this.stream,
			seqNum: this.message.seqNum
		}).sendEmailNotifications((error, lastPost) => {
			if (error) { return callback(error); }
			this.lastPost = lastPost;
			callback();
		});
	}

	getNextPost (callback) {
		if (!this.lastPost) { return callback(); }
		const lastSeqNum = this.lastPost ? this.lastPost.get('seqNum') : this.message.seqNum;
		const query = {
			streamId: this.stream.id,
			seqNum: { $gt: lastSeqNum }
		};
		this.data.posts.getByQuery(
			query,
			(error, posts) => {
				if (error) { return callback(error); }
				this.nextPost = posts[0] || null;
				callback();
			},
			{
				databaseOptions: {
					fields: ['_id', 'seqNum'],
					hint: Indexes.bySeqNum
				},
				limit: 1
			}
		);
	}

	triggerNextTimer (callback) {
		if (!this.nextPost) {
			return callback();
		}
		const queue = new EmailNotificationQueue({
			request: this,
			post: this.nextPost,
			stream: this.stream
		});
		queue.queueEmailNotifications(error => {
			if (error) {
				this.api.warn(`Unable to queue next email notifications for stream ${this.stream.id} and post ${this.nextPost.id}: ${error.toString()}`);
			}
			callback();
		});
	}

	updateStreamSeqNum (callback) {
		const seqNum = this.nextPost ? this.nextPost.get('seqNum') : null;
		this.data.streams.updateDirect(
			{ _id: this.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNum: seqNum } },
			error => {
				if (error) {
					this.api.warn(`Unable to update seqNum for stream ${this.stream.id} to ${seqNum}: ${error.toString()}`);
				}
				callback();
			}
		);
	}

	// handle responding to the request
	handleResponse (callback) {
		// since this is a "faux" request, we don't issue any response at all
		this.responseIssued = true;
		callback();
	}
}

module.exports = EmailNotificationRequest;
