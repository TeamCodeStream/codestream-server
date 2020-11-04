'use strict';

const ModifiedReposTest = require('./modified_repos_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class ModifiedReposFetchTest extends ModifiedReposTest {

	get description () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return `should properly update a user with ${which} when requested, checked by fetching the user`;
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return { user: [which, 'modifiedReposModifiedAt', ...UserTestConstants.EXPECTED_USER_FIELDS] };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateUser	// perform the actual update
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		delete this.expectedUser[`${which}.${this.team.id}`];
		const modifiedAt = this.expectedUser[`modifiedReposModifiedAt.${this.team.id}`];
		delete this.expectedUser[`modifiedReposModifiedAt.${this.team.id}`];
		this.expectedUser.modifiedReposModifiedAt = { [this.team.id]: modifiedAt };
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = ModifiedReposFetchTest;
