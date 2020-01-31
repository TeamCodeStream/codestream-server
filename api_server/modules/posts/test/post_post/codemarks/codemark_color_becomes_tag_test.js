'use strict';

const CodemarkTest = require('./codemark_test');
const Assert = require('assert');

class CodemarkColorBecomesTagTest extends CodemarkTest {

	get description () {
		return 'when creating a post with a codemark with a color, a tag should get created with that color';
	}

	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.codemark.tags;
			this.data.codemark.color = 'red';
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepEqual(data.codemark.tags, [ '_red' ], 'did not create tag with color');
		super.validateResponse(data);
	}
}

module.exports = CodemarkColorBecomesTagTest;
