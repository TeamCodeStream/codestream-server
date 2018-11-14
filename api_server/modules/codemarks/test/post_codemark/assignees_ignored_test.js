'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const Assert = require('assert');

class AssigneesIgnoredTest extends PostCodemarkTest {

	get description () {
		return 'should return a valid codemark when creating a non-issue codemark but should ignore assignees';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.assignees = [this.users[1].user._id, this.users[2].user._id];
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(typeof data.codemark.assignees, 'undefined', 'assignees in response should be undefined');
		super.validateResponse(data);
	}
}

module.exports = AssigneesIgnoredTest;
