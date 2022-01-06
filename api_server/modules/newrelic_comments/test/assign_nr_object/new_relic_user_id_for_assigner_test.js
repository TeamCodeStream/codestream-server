'use strict';

const FetchAssignerTest = require('./fetch_assigner_test');
const Assert = require('assert');

class NewRelicUserIdForAssignerTest extends FetchAssignerTest {

	get description () {
		return 'when assigning a user to a New Relic object, if a New Relic user ID is provided for the assigner, that ID should be stored in the assigner\'s provider identities';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.nrCommentOptions.includeNewRelicUserIdForCreator = true;
			callback();
		});
	}

	validateFetchedUser (response) {
		const { user } = response;
		Assert.deepStrictEqual(
			user.providerIdentities,
			[`newrelic::${this.requestData.creator.newRelicUserId}`],
			'New Relic user ID was not added to providerIdentities'
		);
		super.validateFetchedUser(response);
	}
}

module.exports = NewRelicUserIdForAssignerTest;
