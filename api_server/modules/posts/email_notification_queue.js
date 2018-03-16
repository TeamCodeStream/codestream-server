// handle queueing email notifications in response to a new post
//
// the requirement is for email notifications to be sent no more than once every interval
// (defined by configuration, which feeds from CS_API_EMAIL_NOTIFICATION_INTERVAL) ...
// so when a new message comes in, we kick off a timer to handle email notifications for
// that stream after that interval has elapsed ... we have the sequence number of the
// post that kicked off the timer ... if new messages come in, we compare to the saved
// sequence number ... if the saved sequence number is smaller than the current sequence
// number, we don't set a new timer, because one is already in progress ... if the
// current sequence number is smaller, that's probably a race condition and we do
// set a timer, and now there are TWO timers ... but when the timers elapse, they
// check that the sequence number that initiated them matches what is saved ... in
// the case of a race condition, only one of the timers will actually execute the
// sending of email notifications

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class EmailNotificationQueue {

	constructor (options) {
		Object.assign(this, options);
	}

	// initiate the email notification interval timer as needed
	initiateEmailNotifications (callback) {
		// emailNotificationSeqNum indicates the post that triggered the interval
		// timer for email notifications ... if it is null, that means we are the
		// first new post, so we should trigger the interval timer to start ...
		// a second case is if our post has a seqNum less than the seqNum of the
		// post that triggered an existing interval timer ... in this case we want
		// the earliest post to be triggered, so we'll proceed, knowing there might
		// be two interval timers, but that's ok, because when the timers expire,
		// processing will proceed only for the earliest post
		//
		// note that another condition applies here --- if the sequence number
		// was set more than twice the interval ago (indicated by
		// emailNotificationSeqNumSetAt), we assume it is stale, i.e.,
		// that something broke and email notifications were never sent when they
		// were supposed to be, this is a failsafe to prevent stale values from
		// blocking email sends forever
		const seqNum = this.stream.get('emailNotificationSeqNum');
		const seqNumSetAt = this.stream.get('emailNotificationSeqNumSetAt') || 0;
		if (
			seqNum &&
			seqNum < this.post.get('seqNum') &&
			seqNumSetAt > Date.now() - 2 * this.request.api.config.email.notificationInterval
		) {
			return callback();
		}
		BoundAsync.series(this, [
			this.setAndFetchSeqNum,		// set and fetch the sequence number representing the oldest post for an email notification
			this.backOffAsNeeded,		// if another timer is already in progress, back off setting a new timer
			this.queueEmailNotifications,	// really set the interval timer to queue email notifications after the interval has elapsed
			this.setWhenSet				// if we really queued, set when we set the sequence number that queued it, to prevent stale timers
		], error => {
			if (!error || error === true) {	// error === true is a "normal" short-circuit of the series
				return callback();
			}
			else {
				return callback(error);
			}
		});
	}

	// set the sequence number of the post that is triggering email notifications after
	// the interval ... and fetch the sequence number that was already set, using
	// a findAndModify operation that is atomic and thus not subject to race conditions
	setAndFetchSeqNum (callback) {
		// here we perform an atomic find-and-modify of the emailNotificationSeqNum
		// attribute for the stream ... we'll get back the value of the attribute
		// before we did the set ... this tells us whether another worker thread,
		// processing a different post, should win the right to set off the timer
		// we'll do 10 retries to avoid contention
		let numRetries = 0;
		let gotError = null;
		const query = {
			_id: this.request.data.streams.objectIdSafe(this.stream.id)
		};
		const update = {
			$set: {
				emailNotificationSeqNum: this.post.get('seqNum')
			}
		};
		const options = {
			databaseOptions: {
				fields: {
					emailNotificationSeqNum: 1,
					emailNotificationSeqNumSetAt: 1
				}
			}
		};
		BoundAsync.whilst(
			this,
			() => {
				return !this.foundSeqNum && numRetries < 10;
			},
			whilstCallback => {
				this.setAndFetch(query, update, options, error => {
					if (error) {
						numRetries++;
						gotError = error;
					}
					whilstCallback();
				});
			},
			() => {
				callback(gotError);
			}
		);
	}

	// do the actual atomic find-and-modify operation to set emailNotificationSeqNum
	setAndFetch (query, update, options, callback) {
		this.request.data.streams.findAndModify(
			query,
			update,
			(error, foundStream) => {
				if (error) { return callback(error); }
				this.foundSeqNum = foundStream.emailNotificationSeqNum;
				this.foundSeqNumSetAt = foundStream.emailNotificationSeqNumSetAt;
				callback();
			},
			options
		);
	}

	// if when we performed the set-and-fetch, we found a sequence number lower
	// than our triggering post, that means that since we last read in the stream,
	// another post was sent and it set off an interval timer before we did ...
	// a subtle race condition situation ... in this case, we'll want to back off
	// the sequence number we set and restore it to the one we read, letting the
	// timer that was presumably already set expire
	backOffAsNeeded (callback) {
		if (
			this.foundSeqNum &&
			this.foundSeqNum < this.post.get('seqNum') &&
			this.foundSeqNumSetAt > Date.now() - 2 * this.request.api.config.email.notificationInterval
		) {
			this.backedOff = true;
			this.restoreSeqNum(this.foundSeqNum, callback);
		}
		else {
			callback();
		}
	}

	// restore the emailNotificationSeqNum value to its original value before
	// we modified it ... see backOffAsNeeded() above
	restoreSeqNum (seqNum, callback) {
		this.request.data.streams.updateDirect(
			{ _id: this.request.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNum: seqNum } },
			error => {
				if (error) { return callback(error); }
				callback(true);	// this will harmlessly short-circuit the series
			}
		);
	}

	// so yep, we really are going to queue email notifications based on this
	// post's sequence number ... set up a message to put into queue, with a delay
	// equal to the configured interval
	queueEmailNotifications (callback) {
		const message = {
			postId: this.post.id,
			streamId: this.stream.id,
			seqNum: this.post.get('seqNum')
		};
		const delay = Math.floor(this.request.api.config.email.notificationInterval / 1000);
		this.request.log(`Triggering email notifications for stream ${this.stream.id} in ${delay} seconds...`);
		this.request.api.services.queueService.sendMessage(
			this.request.api.config.aws.sqs.outboundEmailQueueName,
			message,
			{ delay: delay },
			callback
		);
	}

	// we really did queue an email notifications, now we need to save when we did
	// that ... if a future post causes us to read this value, and twice the send interval
	// has elapsed, we assume this value is stale and we kill it ... obviously something
	// went wrong and the interval timer never went off as expected, or it didn't do
	// what was expected, or it crashed ... but we don't want that to prevent emails
	// from being sent indefinitely....
	setWhenSet (callback) {
		this.request.data.streams.updateDirect(
			{ _id: this.request.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNumSetAt: Date.now() } },
			callback
		);
	}
}

module.exports = EmailNotificationQueue;
