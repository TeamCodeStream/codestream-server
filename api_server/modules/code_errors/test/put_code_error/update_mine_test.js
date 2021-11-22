'use strict';

const PutCodeErrorTest = require('./put_code_error_test');

class UpdateMineTest extends PutCodeErrorTest {

	get description () {
		return 'should return the updated code error when updating a code error created by me';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 0;
			callback();
		});
	}
}

module.exports = UpdateMineTest;
