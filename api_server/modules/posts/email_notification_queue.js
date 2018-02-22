// handle queueing email notifications in response to a new post
//
// the requirement is for email notifications to be sent no more than once every interval
// (defined by configuration, which feeds from CS_API_EMAIL_NOTIFICATION_INTERVAL) ...
//

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
		// the earliest post to be trigger, so we'll proceed, knowing there might
		// be two interval timers, but that's ok, because when the timers expire,
		// processing will proceed only for the earliest post
		const seqNum = this.stream.get('emailNotificationSeqNum');
		if (seqNum && seqNum < this.post.get('seqNum')) {
console.warn('GOT seqNum OF ' + seqNum + ', NO NEED TO QUEUE');
			return callback();
		}
		BoundAsync.series(this, [
			this.setAndFetchSeqNum,
			this.backOffAsNeeded,
			this.queueEmailNotifications
		], callback);
	}

	setAndFetchSeqNum (callback) {
		// here we perform an atomic find-and-modify of the emailNotificationSeqNum
		// attribute for the stream ... we'll get back the value of the attribute
		// before we did the set ... this tells us whether another worker thread,
		// processing a different post, should win the right to set off the timer
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
				fields: { emailNotificationSeqNum: 1 }
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
			callback
		);
	}

	setAndFetch (query, update, options, callback) {
		this.request.data.streams.findAndModify(
			query,
			update,
			(error, foundStream) => {
				if (error) { return callback(error); }
				this.foundSeqNum = foundStream.emailNotificationSeqNum;
console.warn('SET foundSeqNum TO ' + this.foundSeqNum);
				callback();
			},
			options
		);
	}

	backOffAsNeeded (callback) {
		if (this.foundSeqNum && this.foundSeqNum < this.post.get('seqNum')) {
			this.backedOff = true;
console.warn('BACKING OFF AND RESTORING TO ' + this.foundSeqNum);
			this.restoreSeqNum(this.foundSeqNum, callback);
		}
		else {
			callback();
		}
	}

	restoreSeqNum (seqNum, callback) {
		this.request.data.streams.updateDirect(
			{ _id: this.request.data.streams.objectIdSafe(this.stream.id) },
			{ $set: { emailNotificationSeqNum: seqNum } },
			callback
		);
	}

	queueEmailNotifications (callback) {
		if (this.backedOff) {
			return callback();
		}
		const message = {
			postId: this.post.id,
			streamId: this.stream.id,
			seqNum: this.post.get('seqNum')
		};
		const delay = Math.floor(this.request.api.config.email.notificationInterval / 1000);
console.warn('QUEUEING FOR ' + message.seqNum + ' IN ' + delay);
		this.request.api.services.queueService.sendMessage(
			this.request.api.config.aws.sqs.outboundEmailQueueName,
			message,
			{ delay: delay },
			callback
		);
	}
}

module.exports = EmailNotificationQueue;
