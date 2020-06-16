'use strict';

const DeleteTagTest = require('./delete_tag_test');

class ACLTest extends DeleteTagTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [2, 3];
	}

	get description () {
		return 'should return an error when trying to delete a tag for a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
