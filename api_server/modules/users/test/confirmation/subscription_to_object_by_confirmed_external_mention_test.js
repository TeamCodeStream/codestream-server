'use strict';

const SubscriptionTest = require('./subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class SubscriptionToObjectByConfirmedExternalMentionTest extends SubscriptionTest {

	get description () {
		return 'a user who gets mentioned in the NR comment engine and then registers should be able to subscribe to the object channel for the code error';
	}

	confirm (callback) {
		// before doing the login, mention the user in a code error
		BoundAsync.series(this, [
			this.postNRComment,
			this.mentionUser,
			super.confirm
		], callback);
	}

	postNRComment (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
		data.creator.email = this.users[2].user.email;
		this.doApiRequest(
			{
				method: 'post',
				path: '/nr-comments',
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-Code-Error-Id': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.nrCommentResponse = response;
				this.which = 'object';
				this.object = { id: response.post.codeErrorId };
				callback();
			}
		);
	}

	mentionUser (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
		data.creator.email = this.users[2].user.email;
console.warn('MENTIONinG uSER ' + this.users[3].user.id + ':' + this.users[3].user.email);
		Object.assign(data, {
			mentionedUsers: [{ email: this.users[3].user.email }],
			objectId: this.nrCommentResponse.post.objectId,
			objectType: this.nrCommentResponse.post.objectType,
			accountId: this.nrCommentResponse.post.accountId
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/nr-comments',
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			callback
		);
	}
}

module.exports = SubscriptionToObjectByConfirmedExternalMentionTest;
