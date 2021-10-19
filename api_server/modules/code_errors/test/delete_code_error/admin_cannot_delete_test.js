'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class AdminCannotDeleteTest extends DeleteCodeErrorTest {

	get description () {
		return 'admins can delete code errors by others on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the creator of a code error can delete it'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = AdminCannotDeleteTest;
