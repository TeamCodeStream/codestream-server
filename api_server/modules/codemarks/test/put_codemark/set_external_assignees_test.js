'use strict';

const SetExternalProviderTest = require('./set_external_provider_test');

class SetExternalAssigneesTest extends SetExternalProviderTest {

	constructor (options) {
		super(options);
		this.updateExternalAssignees = true;
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return the updated codemark when updating a codemark with external provider info, along with external assignees';
	}

}

module.exports = SetExternalAssigneesTest;