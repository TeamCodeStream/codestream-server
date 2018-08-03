'use strict';

const DeletePostTest = require('./delete_post_test');

class ACLTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.otherUserCreatesPost = true;
	}

	get description () {
		return 'should return an error when trying to delete a post authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the post author or a team admin can delete the post'
		};
	}
}

module.exports = ACLTest;
