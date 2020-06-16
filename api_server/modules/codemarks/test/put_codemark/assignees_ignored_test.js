'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const Assert = require('assert');

class AssigneesIgnoredTest extends PutCodemarkTest {

	get description () {
		return 'should return the updated codemark but should ignore assignees for non-issue codemarks';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(() => {
			this.data.assignees = [this.users[1].user.id, this.users[2].user.id];
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(typeof data.codemark.$set.assignees, 'undefined', 'assignees in response should be undefined');
		super.validateResponse(data);
	}
}

module.exports = AssigneesIgnoredTest;
