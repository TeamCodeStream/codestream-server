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

class EmailNotificationQueue {

	constructor (options) {
		Object.assign(this, options);
	}

	// initiate the email notification interval timer as needed
	async initiateEmailNotifications () {
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
		const staleInterval = 2 * Math.max(
			this.request.api.config.email.notificationInterval, 
			this.request.api.config.api.sessionAwayTimeout
		);
		if (
			seqNum &&
			seqNum < this.fromSeqNum &&
			seqNumSetAt > Date.now() - staleInterval
		) {
			return;
		}
		await this.setAndFetchSeqNum();		// set and fetch the sequence number representing the oldest post for an email notification
		if (await this.backOffAsNeeded()) {
			return; // if another timer is already in progress, back off setting a new timer
		}
		await this.queueEmailNotifications();	// really set the interval timer to queue email notifications after the interval has elapsed
		await this.setWhenSet();				// if we really queued, set when we set the sequence number that queued it, to prevent stale timers
	}

	// set the sequence number of the post that is triggering email notifications after
	// the interval ... and fetch the sequence number that was already set, using
	// a findAndModify operation that is atomic and thus not subject to race conditions
	async setAndFetchSeqNum () {
		// here we perform an atomic find-and-modify of the emailNotificationSeqNum
		// attribute for the stream ... we'll get back the value of the attribute
		// before we did the set ... this tells us whether another worker thread,
		// processing a different post, should win the right to set off the timer
		// we'll do 10 retries to avoid contention
		let numRetries = 0;
		let gotError = null;
		const query = {
			id: this.request.data.streams.objectIdSafe(this.stream.id)
		};
		const update = {
			$set: {
				emailNotificationSeqNum: this.fromSeqNum
			}
		};
		const options = {
			fields: {
				emailNotificationSeqNum: 1,
				emailNotificationSeqNumSetAt: 1
			}
		};
		while (!this.foundSeqNum && numRetries < 10) {
			try {
				await this.setAndFetch(query, update, options);
			}
			catch (error) {
				numRetries++;
				gotError = error;
			}
		}
		if (gotError) {
			throw gotError;
		}
	}

	// do the actual atomic find-and-modify operation to set emailNotificationSeqNum
	async setAndFetch (query, update, options) {
		const foundStream = await this.request.data.streams.findAndModify(
			query,
			update,
			options
		);
		this.foundSeqNum = foundStream.emailNotificationSeqNum;
		this.foundSeqNumSetAt = foundStream.emailNotificationSeqNumSetAt;
	}

	// if when we performed the set-and-fetch, we found a sequence number lower
	// than our triggering post, that means that since we last read in the stream,
	// another post was sent and it set off an interval timer before we did ...
	// a subtle race condition situation ... in this case, we'll want to back off
	// the sequence number we set and restore it to the one we read, letting the
	// timer that was presumably already set expire
	async backOffAsNeeded () {
		const staleInterval = 2 * Math.max(
			this.request.api.config.email.notificationInterval, 
			this.request.api.config.api.sessionAwayTimeout
		);
		if (
			this.foundSeqNum &&
			this.foundSeqNum < this.fromSeqNum &&
			this.foundSeqNumSetAt > Date.now() - staleInterval
		) {
			this.backedOff = true;
			await this.restoreSeqNum(this.foundSeqNum);
			return true;
		}
	}

	// restore the emailNotificationSeqNum value to its original value before
	// we modified it ... see backOffAsNeeded() above
	async restoreSeqNum (seqNum) {
		await this.request.data.streams.updateDirect(
			{ id: this.request.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNum: seqNum } }
		);
	}

	// so yep, we really are going to queue email notifications based on this
	// post's sequence number ... set up a message to put into queue, with a delay
	// equal to the configured interval
	async queueEmailNotifications () {
		const message = {
			type: 'notification',
			streamId: this.stream.id,
			seqNum: this.fromSeqNum,
			initialTriggerTime: this.initialTriggerTime
		};
		const delay = this.request.api.config.email.notificationInterval;
		this.request.log(`Triggering email notifications for stream ${this.stream.id} in ${delay} ms...`);
		this.request.api.services.email.queueEmailSend(
			message,
			{ 
				delay: delay,
				request: this.request
			}
		);
	}

	// we really did queue an email notifications, now we need to save when we did
	// that ... if a future post causes us to read this value, and twice the send interval
	// has elapsed, we assume this value is stale and we kill it ... obviously something
	// went wrong and the interval timer never went off as expected, or it didn't do
	// what was expected, or it crashed ... but we don't want that to prevent emails
	// from being sent indefinitely....
	async setWhenSet () {
		await this.request.data.streams.updateDirect(
			{ id: this.request.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNumSetAt: Date.now() } }
		);
	}
}

module.exports = EmailNotificationQueue;
