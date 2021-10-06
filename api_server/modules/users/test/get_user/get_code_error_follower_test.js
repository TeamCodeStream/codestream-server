'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetCodeErrorFollowerTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.members = [];
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodeError: true
		})
	}

	get description () {
		return 'should return user when requesting a user who is a follower of a code error i am also a follower of';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.mentionCurrentUser
		], callback);
	}

	mentionCurrentUser (callback) {
		this.otherUser = this.users[1].user;
		this.path = '/users/' + this.otherUser.id;
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.postData[0].post.id,
					streamId: this.postData[0].post.streamId,
					text: RandomString.generate(100),
					mentionedUserIds: [this.users[0].user.id]
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// validate the response to the request test
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUser.id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCodeErrorFollowerTest;
