'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class AdminCanDeleteTest extends DeleteCodeErrorTest {

	get description () {
		return 'admins can delete code errors by others on the team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = AdminCanDeleteTest;
