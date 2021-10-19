'use strict';

const FetchUserTest = require('./fetch_user_test');
const Assert = require('assert');

class NewRelicUserIdTest extends FetchUserTest {

	get description () {
		return 'when creating a New Relic comment, if a New Relic user ID is provided, that ID should be stored in the creator\'s provider identities';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.nrCommentOptions.includeNewRelicUserId = true;
			callback();
		});
	}

	validateFetchedUser (response) {
		const { user } = response;
		Assert.deepStrictEqual(
			user.providerIdentities,
			[`newrelic::${this.nrCommentResponse.post.creator.newRelicUserId}`],
			'New Relic user ID was not added to providerIdentities'
		);
		super.validateFetchedUser(response);
	}
}

module.exports = NewRelicUserIdTest;
