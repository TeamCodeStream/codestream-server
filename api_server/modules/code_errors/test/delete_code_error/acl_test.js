'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class ACLTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when someone other than the creator tries to delete a code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the creator of a code error can delete it'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTest;
