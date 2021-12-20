'use strict';

const FetchObjectTest = require('./fetch_object_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchAssigneeTest extends FetchObjectTest {

	get description () {
		return 'should create a faux user for the assignee, when assigning a user to a New Relic object with a new email for the assignee, checked by fetching the user (after registration)';
	}

	get method () {
		return 'get';
	}

	// run the original test, but then also fetch the created user
	run (callback) {
		this.userToRegister = 'assignee';
		BoundAsync.series(this, [
			super.run,
			this.fetchUser
		], callback);
	}

	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.validateFetchedUser(response);
				callback();
			}
		);
	}

	validateFetchedUser (response) {
		const { user } = response;
		const creatorId = this.nrAssignmentResponse.codeStreamResponse.post.creatorId;
		Assert.equal(user.id, creatorId, 'fetched user is not the assignee');
		Assert.equal(user.email, this.requestData.creator.email, 'user\'s email does not match the email of the assignee');
	}
}

module.exports = FetchAssigneeTest;
