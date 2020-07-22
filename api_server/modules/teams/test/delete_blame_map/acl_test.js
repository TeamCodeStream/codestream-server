'use strict';

const DeleteBlameMapTest = require('./delete_blame_map_test');

class ACLTest extends DeleteBlameMapTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [2, 3];
	}

	get description () {
		return 'should return an error when trying to remove a blame-map entry for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
