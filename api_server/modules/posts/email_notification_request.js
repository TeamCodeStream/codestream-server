'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const EmailNotificationSender = require('./email_notification_sender');
const Indexes = require('./indexes');
const EmailNotificationQueue = require('./email_notification_queue');

class EmailNotificationRequest extends RestfulRequest {

	async authorize () {
		// this is a "faux" request, not initiated by a user at all, so it is
		// fully safe to authorize
		return;
	}

	// process the "request", which is not a request per se, but a message received
	// after the timer interval
	async process () {
		this.log(`Processing an email notification request: ${JSON.stringify(this.message)}`);
		try {
			await this.getStream();				// get the stream associated with these notifications
			if (await this.sendEmails()) {
				return;	// indicates we don't really need to send any emails
			}		// send the actual emails
			await this.getNextPost();			// get the next post after the last post that was sent in the notifications
			await this.triggerNextTimer();		// if there is a next post, we should set off a new timer, since that post did not trigger it while we were busy
			await this.updateStreamSeqNum();	// update the emailNotificationSeqNum value to reflect the timer being set again
		}
		catch (error) {
			return this.warn('Email notification handling failed: ' + JSON.stringify(error));
		}
		this.log(`Successfully processed an email notification request: ${JSON.stringify(this.message)}`);
	}

	// get the stream associated with these notifications
	async getStream () {
		this.stream = this.data.streams.getById(this.message.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
	}

	// send the actual emails as needed
	async sendEmails () {
		if (this.stream.get('emailNotificationSeqNum') !== this.message.seqNum) {
			// we only do email notifications if our seqNum (the sequence number of the post
			// that triggered the interval timer and ultimately this call) matches the one
			// stored with the stream ... if it doesn't match, we assume another interval
			// timer has been set up with the proper seqNum (fingers crossed)
			return true;	// short-circuit the flow
		}
		// this is the last post we know about in sending the email notifications, there may yet have been a post since that one...
		this.lastPost = await new EmailNotificationSender({
			request: this,
			stream: this.stream,
			seqNum: this.message.seqNum
		}).sendEmailNotifications();
	}

	// given the last post that we knew about when sending email notifications, account
	// for the fact that new post might have come in while we were sending ... since
	// emailNotificationSeqNum is still set, that new post would not have triggered
	// a new interval timer, so we take care of that now as needed
	async getNextPost () {
		// given the last post that we knew about, or the post that triggered these
		// email notifications if no notifications were actually sent, look for the
		// next post after that, meaning a new one arrived during our processing
		// of these notifications
		const lastSeqNum = this.lastPost ? this.lastPost.get('seqNum') : this.message.seqNum;
		const query = {
			streamId: this.stream.id,
			seqNum: { $gt: lastSeqNum }
		};
		const posts = await this.data.posts.getByQuery(
			query,
			{
				databaseOptions: {
					fields: ['_id', 'seqNum'],
					hint: Indexes.bySeqNum
				},
				limit: 1
			}
		);
		this.nextPost = posts[0] || null;
	}

	// if a new post came in while we were processing these notifications, we need
	// to trigger a new interval timer
	async triggerNextTimer () {
		if (!this.nextPost) {
			return;	// no new posts came in, we are good
		}
		const queue = new EmailNotificationQueue({
			request: this,
			post: this.nextPost,
			stream: this.stream
		});
		try {
			await queue.queueEmailNotifications();
		}
		catch (error) {
			this.api.warn(`Unable to queue next email notifications for stream ${this.stream.id} and post ${this.nextPost.id}: ${error.toString()}`);
		}
	}

	// either we set a new interval timer, or no new posts came in, in which case we
	// need to announce that the next post will be good to trigger the next timer ...
	// set emailNotificationSeqNum accordingly
	async updateStreamSeqNum () {
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
		try {
			await this.data.streams.updateDirect(
				{ _id: this.data.streams.objectIdSafe(this.stream.id) },
				update
			);
		}
		catch (error) {
			this.api.warn(`Unable to update seqNum for stream ${this.stream.id} (${JSON.stringify(update)}): ${error.toString()}`);
		}
	}

	// handle responding to the request
	async handleResponse () {
		// since this is a "faux" request, we don't issue any response at all
		this.responseIssued = true;
	}
}

module.exports = EmailNotificationRequest;
