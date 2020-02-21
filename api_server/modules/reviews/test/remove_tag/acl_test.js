'use strict';

const RemoveTagTest = require('./remove_tag_test');

class ACLTest extends RemoveTagTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
	}

	get description () {
		return 'should return an error when trying to remove a tag from a review on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
