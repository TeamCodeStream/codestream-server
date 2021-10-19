'use strict';

const SubscriptionTest = require('./subscription_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class SubscriptionToObjectByMentionTest extends SubscriptionTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodeError: true
		});
	}

	get description () {
		return `user should be able to subscribe to an object channel after raw login when they have been mentioned in an object stream`;
	}

	login (callback) {
		// before doing the login, mention the user in a code error
		BoundAsync.series(this, [
			this.mentionUser,
			super.login
		], callback);
	}

	mentionUser (callback) {
		this.object = this.postData[0].codeError;
		this.which = 'object';
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.postData[0].codeError.streamId,
					parentPostId: this.postData[0].post.id,
					text: RandomString.generate(100),
					mentionedUserIds: [this.users[1].user.id]
				},
				token: this.token
			},
			callback
		);
	}
}

module.exports = SubscriptionToObjectByMentionTest;
