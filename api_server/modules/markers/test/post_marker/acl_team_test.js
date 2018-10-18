'use strict';

const PostMarkerTest = require('./post_marker_test');

class ACLTeamTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker in a team the user isn\'t a member of';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTeamTest;
