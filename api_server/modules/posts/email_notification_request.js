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

	// process the "request", which is not a request per se, but a message received
	// after the timer interval
	process (callback) {
		this.log(`Processing an email notification request: ${JSON.stringify(this.message)}`);
		BoundAsync.series(this, [
			this.getStream,			// get the stream associated with these notifications
			this.sendEmails,		// send the actual emails
			this.getNextPost,		// get the next post after the last post that was sent in the notifications
			this.triggerNextTimer,	// if there is a next post, we should set off a new timer, since that post did not trigger it while we were busy
			this.updateStreamSeqNum	// update the emailNotificationSeqNum value to reflect the timer being set again
		], error => {
			if (error && error !== true) {	// error === true means a normal short-circuit of the series
				this.warn('Email notification handling failed: ' + JSON.stringify(error));
			}
			this.log(`Successfully processed an email notification request: ${JSON.stringify(this.message)}`);
			callback();
		});
	}

	// get the stream associated with these notifications
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

	// send the actual emails as needed
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
			this.lastPost = lastPost;	// this is the last post we know about in sending the email notifications, there may yet have been a post since that one...
			callback();
		});
	}

	// given the last post that we knew about when sending email notifications, account
	// for the fact that new post might have come in while we were sending ... since
	// emailNotificationSeqNum is still set, that new post would not have triggered
	// a new interval timer, so we take care of that now as needed
	getNextPost (callback) {
		// given the last post that we knew about, or the post that triggered these
		// email notifications if no notifications were actually sent, look for the
		// next post after that, meaning a new one arrived during our processing
		// of these notifications
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

	// if a new post came in while we were processing these notifications, we need
	// to trigger a new interval timer
	triggerNextTimer (callback) {
		if (!this.nextPost) {
			return callback();	// no new posts came in, we are good
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

	// either we set a new interval timer, or no new posts came in, in which case we
	// need to announce that the next post will be good to trigger the next timer ...
	// set emailNotificationSeqNum accordingly
	updateStreamSeqNum (callback) {
		let update;
		if (this.nextPost) {
			update = {
				$set: {
					emailNotificationSeqNum: this.nextPost.get('seqNum'),
					emailNotificationSeqNumSetAt: Date.now()
				}
			};
		}
		else {
			update = {
				$unset: {
					emailNotificationSeqNum: true,
					emailNotificationSeqNumSetAt: true
				}
			};
		}
		this.data.streams.updateDirect(
			{ _id: this.data.streams.objectIdSafe(this.stream.id) },
			update,
			error => {
				if (error) {
					this.api.warn(`Unable to update seqNum for stream ${this.stream.id} (${JSON.stringify(update)}): ${error.toString()}`);
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
