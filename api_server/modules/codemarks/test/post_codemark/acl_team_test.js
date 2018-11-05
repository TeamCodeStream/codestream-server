'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class ACLTeamTest extends PostCodemarkTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
	
	get description () {
		return 'should return an error when trying to create an codemark in a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTeamTest;
