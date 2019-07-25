'use strict';

const CreateTagTest = require('./create_tag_test');

class ACLTest extends CreateTagTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [2, 3];
	}

	get description () {
		return 'should return an error when trying to create a tag for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
