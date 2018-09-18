'use strict';

const EmailNotificationProcessor = require('./emailNotificationProcessor');
const Index = require('./postIndex');
const { callbackWrap } = require('./server_utils/await_utils');
const Config = require('./config');

class EmailNotificationHandler {

	constructor (options) {
		Object.assign(this, options);
	}

	async handleMessage (message) {
		this.message = message;
		this.log(`Processing an email notification request: ${JSON.stringify(this.message)}`);
		this.processingStartedAt = Date.now();
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
console.warn('ERROR', error);
			return this.warn('Email notification handling failed: ' + JSON.stringify(error));
		}
		this.log(`Successfully processed an email notification request: ${JSON.stringify(this.message)}`);
	}

	// get the stream associated with these notifications
	async getStream () {
		this.stream = await this.data.streams.getById(this.message.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
	}

	// send the actual emails as needed
	async sendEmails () {
		if (this.stream.emailNotificationSeqNum !== this.message.seqNum) {
			// we only do email notifications if our seqNum (the sequence number of the post
			// that triggered the interval timer and ultimately this call) matches the one
			// stored with the stream ... if it doesn't match, we assume another interval
			// timer has been set up with the proper seqNum (fingers crossed)
console.warn('SEQNUM DOES NOT MATCH');
			return true;	// short-circuit the flow
		}
		// this is the last post we know about in sending the email notifications, there may yet have been a post since that one...

		this.lastPost = await new EmailNotificationProcessor({
			logger: this,
			data: this.data,
			stream: this.stream,
			seqNum: this.message.seqNum,
			messager: this.messager,
			sender: this.sender
		}).sendEmailNotifications();
console.warn('SENT');
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
		const lastSeqNum = this.lastPost ? this.lastPostseqNum : this.message.seqNum;
		const query = {
			streamId: this.stream.id,
			seqNum: { $gt: lastSeqNum }
		};
		const posts = await this.data.posts.getByQuery(
			query,
			{
				fields: ['_id', 'seqNum'],
				hint: Index.bySeqNum,
				limit: 1
			}
		);
		this.nextPost = posts[0] || null;
console.warn('NEXT POST? ' + this.nextPost);
	}

	// trigger next interval timer, as needed
	async triggerNextTimer () {
		let initialTriggerTime;
		this.fromSeqNum = null;

		// so if a new post came in since we sent notifications for our last set of posts, then
		// we need to trigger a new timer for that post, because notification timers have
		// been suppressed since setting emailNotificationSeqNum for the stream 
		if (this.nextPost) {
			this.fromSeqNum = this.nextPostseqNum;
			initialTriggerTime = this.nextPost.createdAt;
		}

		// but otherwise, we also try to take care of users that were online for this
		// notification check but may go offline within the next few minutes ... for those
		// users, we want to ensure they get a notification too, so we "mop up" those users
		// by triggering another timer, we do this over and over until the full "away timeout"
		// interval has passed since the post's creation
		else {
console.warn('startedAt=' + this.processingStartedAt);
console.warn('initialTriggerTime=' + this.message.initialTriggerTime);
console.warn('awayTimeout=' + Config.sessionAwayTimeout);
			const timeSinceTriggerTime = this.processingStartedAt - this.message.initialTriggerTime;
			if (timeSinceTriggerTime <= Config.sessionAwayTimeout) {
console.warn('MUST MOP');
				this.log(`Mopping up offline users for stream ${this.stream.id}...`);
				this.fromSeqNum = this.message.seqNum;
				initialTriggerTime = this.message.initialTriggerTime;
			}
		}
		if (!this.fromSeqNum) {
console.warn('NOTHIGN TO TRIGGER');
			return;
		}

		const message = {
			type: 'notification',
			streamId: this.stream._id,
			seqNum: this.fromSeqNum,
			initialTriggerTime
		};
		const delay = Math.floor(Config.notificationInterval / 1000);
console.warn('TRIGGERING...');
		this.log(`Triggering email notifications for stream ${this.stream._id} in ${delay} seconds...`);
		try {
			await callbackWrap(
				this.queuer.sendMessage.bind(this.queuer),
				Config.outboundEmailQueueName,
				message,
				{ delay: delay }
			);
		}
		catch (error) {
			this.warn(`Unable to queue next email notifications for stream ${this.stream._id} and seqNum ${this.fromSeqNum}: ${error.toString()}`);
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
					emailNotificationSeqNum: this.nextPost.seqNum,
					emailNotificationSeqNumSetAt: Date.now()
				}
			};
		}
		else if (!this.fromSeqNum) {
			update = {
				$unset: {
					emailNotificationSeqNum: true,
					emailNotificationSeqNumSetAt: true
				}
			};
		}
		else {
			return;
		}
		try {
			await this.data.streams.updateDirect(
				{ _id: this.data.streams.objectIdSafe(this.stream.id) },
				update
			);
		}
		catch (error) {
			this.warn(`Unable to update seqNum for stream ${this.stream.id} (${JSON.stringify(update)}): ${error.toString()}`);
		}
	}

	log (message) {
		console.log(message);
	}

	warn (message) {
		console.warn(message);
	}
}

module.exports = EmailNotificationHandler;
