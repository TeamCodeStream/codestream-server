'use strict';

const DeletePostTest = require('./delete_post_test');

class ACLTest extends DeletePostTest {

	get description () {
		return 'should return an error when trying to delete a post authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the post author or a team admin can delete the post'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTest;
