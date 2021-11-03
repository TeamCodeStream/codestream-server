'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');
const UserTestConstants = require('../user_test_constants');

class GetForeignTeamMemberTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		Object.assign(this.teamOptions, {
			creatorIndex: 2,
			numAdditionalInvites: 2
		});
		Object.assign(this.postOptions, {
			creatorIndex: 2,
			wantCodeError: true,
			claimCodeErrors: true
		});
	}

	get description() {
		return 'should return user when requesting a "foreign" user, one who has commented on a code error owned by the team, but it not actually a member of the team';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_UNREGISTERED_USER_FIELDS };
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }

			// do an NR comment, creating a foreign user relative to our code error
			const codeError = this.postData[0].codeError;
			this.doApiRequest(
				{
					method: 'post',
					path: '/nr-comments',
					data: {
						creator: {
							email: this.userFactory.randomEmail()
						},
						objectId: codeError.objectId,
						objectType: codeError.objectType,
						accountId: codeError.accountId,
						text: RandomString.generate(100)
					},
					requestOptions: {
						headers: {
							'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
							'X-CS-NewRelic-AccountId': codeError.accountId
						}
					}
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.otherUserId = response.post.creatorId;
					this.nrCommentResponse = response;
					this.path = '/users/' + this.otherUserId;
					callback();
				}
			);
		});
	}

	// validate the response to the request test
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUserId, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetForeignTeamMemberTest;
