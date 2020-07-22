'use strict';

const AddBlameMapTest = require('./add_blame_map_test');

class ACLTest extends AddBlameMapTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [2, 3];
	}

	get description () {
		return 'should return an error when trying to add a blame-map entry for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
