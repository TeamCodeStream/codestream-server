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
			this.sendNotificationEmails
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
}

module.exports = PostPostRequest;
