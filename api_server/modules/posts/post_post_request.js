// handle the POST /posts request to create a new post

'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var PostPublisher = require('./post_publisher');
var PostAuthorizer = require('./post_authorizer');
var EmailNotificationSender = require('./email_notification_sender');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	authorize (callback) {
		new PostAuthorizer({
			user: this.user,
			post: this.request.body,
			request: this,
			errorHandler: this.errorHandler
		}).authorizePost(callback);
	}

	// after the post is created...
	postProcess (callback) {
		BoundAsync.parallel(this, [
			this.publishPost,
			this.sendNotificationEmails,
			this.publishPostCount,
			this.sendPostCountToAnalytics
		], callback);
	}

	// publish the post to the appropriate messager channel
	publishPost (callback) {
		new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.creator.stream.attributes
		}).publishPost(callback);
	}

	// send an email notification as needed to users who are offline
	sendNotificationEmails (callback) {
		new EmailNotificationSender({
			request: this,
			team: this.creator.team,
			repo: this.creator.repo,
			stream: this.creator.stream,
			post: this.creator.model,
			creator: this.user
		}).sendEmailNotifications(callback);
	}

	// publish an increase in post count to the author's me-channel
	publishPostCount (callback) {
		if (!this.creator.updatePostCountOp) {
			return callback();	// no joinMethod update to perform
		}
		let channel = 'user-' + this.user.id;
		let message = {
			requestId: this.request.id,
			user: Object.assign({}, this.creator.updatePostCountOp, { _id: this.user.id })
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish post count update message to user ${this.user._id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this
			}
		);
	}

	// send the post count update to our analytics service
	sendPostCountToAnalytics (callback) {
		this.api.services.analytics.setPerson(
			this.user.id,
			{
				'Total Posts': this.user.get('totalPosts'),
				'Date of Last Post': new Date(this.user.get('lastPostCreatedAt')).toISOString()
			},
			{
				request: this,
				user: this.user
			}
		);
		process.nextTick(callback);
	}
}

module.exports = PostPostRequest;
