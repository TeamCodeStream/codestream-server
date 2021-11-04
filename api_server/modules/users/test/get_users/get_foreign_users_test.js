'use strict';

const GetUsersByTeamIdTest = require('./get_users_by_team_id_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class GetForeignUsersTest extends GetUsersByTeamIdTest {

	constructor (options) {
		super(options)
		Object.assign(this.postOptions, {
			creatorIndex: 2,
			wantCodeError: true,
			claimCodeErrors: true
		});
	}

	get description () {
		return 'should return "foreign" users on a team, users who have posted NR comments on a code error owned by a team but are not actually members of the team';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.createNRComments(callback);
		});
	}

	// create a few random NR comments on our code error,
	// we'll make sure the creators are included in the fetch
	createNRComments (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.createNRComment,
			callback
		);
	}

	// create a random NR comment on a code error
	createNRComment (n, callback) {
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
				this.myUsers.push({ id: response.post.creatorId });
				callback();
			}
		);
	}
}

module.exports = GetForeignUsersTest;
