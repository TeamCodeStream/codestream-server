'use strict';

const SubscriptionTest = require('./subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class SubscriptionToObjectByConfirmedExternalUserTest extends SubscriptionTest {

	get description () {
		return 'a user who creates a code error by posting to NR comment engine and then registers should be able to subscribe to the object channel for the created code error';
	}

	confirm (callback) {
		// before doing the login, mention the user in a code error
		BoundAsync.series(this, [
			this.postNRComment,
			super.confirm
		], callback);
	}

	postNRComment (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
		data.creator.email = this.users[3].user.email;
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
				this.which = 'object';
				this.object = { id: response.post.codeErrorId };
				callback();
			}
		);
	}
}

module.exports = SubscriptionToObjectByConfirmedExternalUserTest;
