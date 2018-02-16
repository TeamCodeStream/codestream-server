// fulfill an inbound-email request, called by the inbound email server to
// ingest an inbound email and turn it into a post for the stream

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var PostCreator = require(process.env.CS_API_TOP + '/modules/posts/post_creator');
var PostPublisher = require(process.env.CS_API_TOP + '/modules/posts/post_publisher');
var EmailNotificationSender = require(process.env.CS_API_TOP + '/modules/posts/email_notification_sender');
const Errors = require('./errors');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

class InboundEmailRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the client (the inbound email server) to make this request
	authorize (callback) {
		// we rely on a secret, known only to the inbound email server and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.api.config.secrets.mail) {
			return callback(this.errorHandler.error('unauthorized'));
		}
		callback();
	}

	// process the request...
	process(callback) {
		BoundAsync.series(this, [
			this.requireAllow,
			this.getCreator,
			this.parseToAddresses,
			this.getStream,
			this.validate,
			this.handleAttachments,
			this.createPost
		], callback);
	}

	// these parameters are required and/or optional for the request
	requireAllow (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['from'],
					string: ['text', 'mailFile', 'secret'],
					'array(object)': ['to']
				},
				optional: {
					'array(object)': ['attachments']
				}
			},
			callback
		);
	}

	// get the person from whom the email originated, if we can find them...
	getCreator (callback) {
		let from = this.request.body.from;
		if (!from.address) {
			return callback(this.errorHandler.error('noFromAddress', { info: this.fromEmail }));
		}
		this.fromEmail = from.address.toLowerCase();
		this.log(`Processing an inbound email (${this.request.body.mailFile}) from ${this.fromEmail}`);
		this.data.users.getByQuery(
			{ searchableEmail: this.fromEmail },
			(error, users) => {
				if (error) {
					return callback(this.errorHandler.error('internal', { reason: error }));
				}
				if (users.length === 0) {
					return callback(this.errorHandler.error('creatorNotFound', { info: this.fromEmail }));
				}
				this.fromUser = users[0];
				callback();
			},
			{
				databaseOptions: {
					hint: UserIndexes.bySearchableEmail
				}
			}
		);
	}

	// get the stream ID represented by one of the email addresses in the to-field
	parseToAddresses (callback) {
		this.streamId = null;
		let i = 0;
		// stop when we find the first valid stream ID
		BoundAsync.whilst(
			this,
			() => {
				return !this.streamId && i < this.request.body.to.length;
			},
			(whilstCallback) => {
				this.parseToAddress(this.request.body.to[i++], whilstCallback);
			},
			callback
		);
	}

	// parse a single email object in the to-field, looking for a valid stream ID
	parseToAddress (toObject, callback) {
		let email = toObject.address.toLowerCase();

		// make sure it has our reply-to domain, otherwise we are just plain
		// not interested!
		let regexp = new RegExp(this.api.config.email.replyToDomain + '$', 'i');
		if (!regexp.test(email)) {
			this.log(`Email ${email} does not match the reply-to domain`);
			return callback();
		}

		// extract the first part of the email, this should be our stream ID
		let addressParts = email.trim().split('@');
		if (addressParts.length !== 2) {
			this.log(`Email ${email} is not a valid email`);
			return callback();
		}

		// split the first part by '.', this separates the team ID and the stream ID
		let idParts = addressParts[0].split('.');
		if (idParts.length !== 2) {
			this.log(`Email ${email} does not conform to the correct format for ingestion`);
			return callback();
		}

		// check that the IDs are valid
		if (!this.data.streams.objectIdSafe(idParts[0])) {
			this.log(`Email ${email} does not reference a valid stream ID`);
			return callback();
		}
		if (!this.data.teams.objectIdSafe(idParts[1])) {
			this.log(`Email ${email} does not reference a valid team ID`);
			return callback();
		}

		// good to go
		this.streamId = idParts[0];
		this.teamId = idParts[1];
		process.nextTick(callback);
	}

	// get the stream associated with the IDs we found
	getStream (callback) {
		if (!this.streamId) {
			return callback(this.errorHandler.error('noMatchFound', { info: this.request.body.to }));
		}
		 this.data.streams.getById(
			 this.streamId,
			 (error, stream) => {
				 if (error) {
					 return callback(this.errorHandler.error('internal', { reason: error }));
				 }
				 else if (!stream) {
					 return callback(this.errorHandler.error('streamNotFound', { info: this.streamId }));
				 }
				 this.stream = stream;
				 callback();
			 }
		 );
	}

	// validate the stream: the stream must be owned by the correct team, and the
	// user originating the email must be on the team
	validate (callback) {
		if (this.stream.get('teamId') !== this.teamId) {
			return callback(this.errorHandler.error('streamNoMatchTeam', { info: this.streamId }));
		}
		if (!this.fromUser.hasTeam(this.teamId)) {
			this.log(`User ${this.fromUser.id} is not on team ${this.teamId}`);
			return callback(this.errorHandler.error('unauthorized'));
		}
		process.nextTick(callback);
	}

	// handle any attachments in the email
	handleAttachments (callback) {
		// not yet supported
		callback();
	}

	// create a post for this email in the stream
	createPost (callback) {
		this.user = this.fromUser;
		this.postCreator = new PostCreator({
			request: this
		});
		this.postCreator.createPost({
			streamId: this.streamId,
			text: this.request.body.text
		}, error => {
			if (error) {
				return callback(this.errorHandler.error('internal'), { reason: error });
			}
			this.post = this.postCreator.model;
			this.trackPost();
			this.responseData.post = this.post.getSanitizedObject();
			callback();
		});
	}

	// track this post for analytics, with the possibility that the user may have opted out
	trackPost () {
		const preferences = this.fromUser.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return;
		}
		const trackObject = {
			distinct_id: this.fromUser.id,
			Type: 'Chat',
			Thread: 'Parent',
			Category: 'Source File',
			'Email Address': this.fromUser.get('email'),
//			'Join Method': this.fromUser.get('joinMethod'), // TODO
			'Team ID': this.post.get('teamId'),
// 			'Team Size': this.team.get('memberIds').length, // TODO ... get team
			'Endpoint': 'Email',
			'Plan': 'Free', // FIXME: update when we have payments
			'Date of Last Post': new Date(this.post.get('createdAt')).toISOString()
		};
/*
TODO
		if (this.fromUser.get('registeredAt')) {
			trackObject['Date Signed Up'] = this.fromUser.get('registeredAt');
		}
*/
		this.api.services.analytics.track(
			'Post Created',
			trackObject,
			{
				request: this,
				user: this.user
			}
		);
	}

	// after the post is created...
	postProcess (callback) {
		BoundAsync.parallel(this, [
			this.publishPost,
			this.sendNotificationEmails
		], callback);
	}

	// after the post is created, publish it to the team or stream
	publishPost (callback) {
		new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.stream.attributes
		}).publishPost(callback);
	}

	// send an email notification as needed to users who are offline
	sendNotificationEmails (callback) {
		new EmailNotificationSender({
			request: this,
			team: this.postCreator.team,
			repo: this.postCreator.repo,
			stream: this.stream,
			post: this.postCreator.model,
			creator: this.fromUser
		}).sendEmailNotifications(callback);
	}
}

module.exports = InboundEmailRequest;
