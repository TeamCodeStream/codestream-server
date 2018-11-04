'use strict';

const PostItemTest = require('./post_item_test');

class ACLTeamTest extends PostItemTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
	
	get description () {
		return 'should return an error when trying to create an item in a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTeamTest;
