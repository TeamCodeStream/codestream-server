'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class AssigneesIgnoredTest extends PostCodemarkTest {

	get description () {
		return 'should return a valid codemark when creating a non-issue codemark but should ignore assignees';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.assignees = [
				RandomString.generate(10),
				RandomString.generate(10)
			];
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(typeof data.codemark.assignees, 'undefined', 'assignees in response should be undefined');
		super.validateResponse(data);
	}
}

module.exports = AssigneesIgnoredTest;
