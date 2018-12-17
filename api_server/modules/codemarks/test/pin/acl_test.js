'use strict';

const PinTest = require('./pin_test');

class ACLTest extends PinTest {

	get description () {
		return 'should return an error when trying to pin a codemark in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'must be a member of the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTest;
