'use strict';

const CodemarkTest = require('./codemark_test');
const Assert = require('assert');

class AssigneesIgnoredTest extends CodemarkTest {

	get description () {
		return 'should return a valid codemark when creating a post with a non-issue codemark but should ignore assignees';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.assignees = [this.users[1].user.id, this.users[2].user.id];
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(typeof data.codemark.assignees, 'undefined', 'assignees in response should be undefined');
		super.validateResponse(data);
	}
}

module.exports = AssigneesIgnoredTest;
