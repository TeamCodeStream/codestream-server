'use strict';

const PutPostTest = require('./put_post_test');

class ACLTest extends PutPostTest {

	get description () {
		return 'should return an error when trying to update a post authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the post author can edit the post'
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
