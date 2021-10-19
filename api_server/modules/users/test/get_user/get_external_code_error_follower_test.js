'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetExternalCodeErrorFollowerTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.members = [];
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodeError: true
		})
	}

	get description () {
		return 'should return user when requesting a user who is a follower of a code error i am also a follower of, by virtue of the other user sending a comment through the NR comment engine';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_UNREGISTERED_USER_FIELDS;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeNRComment
		], callback);
	}

	makeNRComment (callback) { 
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const codeError = this.postData[0].codeError;
		Object.assign(data, {
			objectId: codeError.objectId,
			objectType: codeError.objectType,
			accountId: codeError.accountId
		});

		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserId = response.post.creatorId;
				this.path = '/users/' + response.post.creatorId;
				callback();
			}
		);
	}

	// validate the response to the request test
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUserId, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetExternalCodeErrorFollowerTest;
