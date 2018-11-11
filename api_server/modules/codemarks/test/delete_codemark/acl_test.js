'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');

class ACLTest extends DeleteCodemarkTest {

	get description () {
		return 'should return an error when trying to delete a codemark authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the author or a team admin can delete the codemark'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.codemarkCreator = 1;
			callback();
		});
	}
}

module.exports = ACLTest;
