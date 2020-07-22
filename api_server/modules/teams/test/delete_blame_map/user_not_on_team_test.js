'use strict';

const AddBlameMapTest = require('./add_blame_map_test');

class UserNotOnTeamTest extends AddBlameMapTest {

	constructor(options) {
		super(options);
		this.teamOptions.members = [2];
	}

	get description() {
		return 'should return an error when trying to add a blame-map entry for a user that is not a member of the team';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = UserNotOnTeamTest;
