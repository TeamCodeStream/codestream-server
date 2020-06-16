'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const RandomString = require('randomstring');

class IssueWithAssigneesTest extends PostCodemarkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'issue';
	}

	get description () {
		return 'should return a valid codemark when creating an issue codemark with an array of valid assignees';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// for third-party provider codemarks, we can put anything we want in here,
			// it's only if we're not using third-party that the server will try to validate
			// that these are valid members of the team, and that can only happen through POST /posts
			this.data.assignees = [
				RandomString.generate(10),
				RandomString.generate(10)
			];
			callback();
		});
	}
}

module.exports = IssueWithAssigneesTest;
