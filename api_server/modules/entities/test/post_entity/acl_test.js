'use strict';

const PostEntityTest = require('./post_entity_test');

class ACLTest extends PostEntityTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
	
	get description () {
		return 'should return an error when trying to create a New Relic entity in a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTest;
