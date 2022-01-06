'use strict';

const FetchAssigneeTest = require('./fetch_assignee_test');
const Assert = require('assert');

class NewRelicUserIdForAssigneeTest extends FetchAssigneeTest {

	get description () {
		return 'when assigning a user to a New Relic object, if a New Relic user ID is provided for the assignee, that ID should be stored in the assignee\'s provider identities';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.nrCommentOptions.includeNewRelicUserIdForAssignee = true;
			callback();
		});
	}

	validateFetchedUser (response) {
		const { user } = response;
		Assert.deepStrictEqual(
			user.providerIdentities,
			[`newrelic::${this.requestData.assignee.newRelicUserId}`],
			'New Relic user ID was not added to providerIdentities'
		);
		super.validateFetchedUser(response);
	}
}

module.exports = NewRelicUserIdForAssigneeTest;
