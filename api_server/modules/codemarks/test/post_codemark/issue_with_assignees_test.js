'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class IssueWithAssigneesTest extends PostCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return a valid codemark when creating an issue codemark with an array of valid assignees';
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
}

module.exports = IssueWithAssigneesTest;
