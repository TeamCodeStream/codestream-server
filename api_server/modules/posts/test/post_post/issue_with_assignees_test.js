'use strict';

const CodemarkTest = require('./codemark_test');

class IssueWithAssigneesTest extends CodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return a valid codemark when creating a post with an issue codemark with an array of valid assignees';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.assignees = [this.users[1].user._id, this.users[2].user._id];
			callback();
		});
	}
}

module.exports = IssueWithAssigneesTest;
