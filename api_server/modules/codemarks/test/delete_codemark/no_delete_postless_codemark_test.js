'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');

class NoDeletePostlessCodemarkTest extends DeleteCodemarkTest {

	get description () {
		return 'should return an error if an attempt is made to delete a codemark with no post (for third-party provider), as this is no longer supported';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'can not delete third-party provider codemark'
		};
	}

	setTestOptions (callback) {
		this.wantPost = false;
		super.setTestOptions(callback);
	}
}

module.exports = NoDeletePostlessCodemarkTest;
