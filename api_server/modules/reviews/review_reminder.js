'use strict';

const Scheduler = require('node-schedule');
const Indexes = require('./indexes');

class ReviewReminder {

	constructor (options) {
		Object.assign(this, options);
	}

	// schedule jobs to look for reviews which need reminders
	schedule () {
		// stagger each worker's schedule to occur at a random time every hour
		const randomMinutes = Math.floor(Math.random() * 60);
		const randomSeconds = Math.floor(Math.random() * 60);
		this.api.log(`Triggering review reminders for execution at :${randomMinutes}m:${randomSeconds}s for every hour`);
		this.job = Scheduler.scheduleJob(`${randomSeconds} ${randomMinutes} * * * 1-5`, this.remind.bind(this));
	}

	// look for reviews which need reminders, and trigger message to outbound email server for each
	// review needing a reminder
	async remind () {
		const ONE_DAY = 24 * 60 * 60 * 1000;
		const ONE_WEEK = 7 * ONE_DAY;

		this.api.log(`Reminder check triggered`);

		if (this.api.config.email.suppressEmails) {
			this.api.log('Emails are disabled in configuration, not running auto re-invites');
			return;
		}

		// get open reviews for which there has been no activity for 24 hours, and
		// for which we have not sent a reminder yet 
		let reviews = await this.api.data.reviews.getByQuery(
			{
				status: 'open',
				lastActivityAt: { $lt: Date.now() - ONE_DAY },
				lastReminderSentAt: { $exists: false } 
			},
			{
				hint: Indexes.byStatus
			}
		);

		// filter out reviews that have no reviewers, and also old reviews, because we don't want an avalanche
		const now = Date.now();
		reviews = reviews.filter(review => {
			return (review.reviewers || []).length > 0 && review.createdAt > now - 2 * ONE_WEEK;
		});
		if (reviews.length === 0) {
			this.api.log('No reviews found which need reminders');
			return;
		}

		// here we are optimistic, we assume nothing will go wrong with sending out the reminders
		// update each review saying a reminder was sent, so that other workers won't pick these up
		// and try to also send reminders, avoiding double emails
		const ids = reviews.map(review => review.id);
		await this.api.data.reviews.updateDirect(
			{
				id: this.api.data.reviews.inQuerySafe(ids)
			},
			{
				$set: {
					lastReminderSentAt: now
				}
			}
		);

		// check for needed reminders for each
		this.api.log(`${reviews.length} reviews found which need reminders...`);
		for (let i = 0; i < reviews.length; i++) {
			await this.sendReviewReminder(reviews[i]);
		}
	}

	// trigger a message to the outbound email server, to send a reminder email for the post associated with this review
	async sendReviewReminder (review) {
		const message = {
			type: 'notification_v2',
			postId: review.postId,
			isReminder: true
		};
		this.api.log(`Triggering email notification reminder for review ${review.id}...`);
		this.api.services.email.queueEmailSend(message);
	}
};

module.exports = ReviewReminder;