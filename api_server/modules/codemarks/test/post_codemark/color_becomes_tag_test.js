'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const Assert = require('assert');

class ColorBecomesTagTest extends PostCodemarkTest {

	get description () {
		return 'when creating a codemark with a color, a tag should get created with that color';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			delete this.data.tags;
			this.data.color = 'red';
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepEqual(data.codemark.tags, [ '_red' ], 'did not create tag with color');
		super.validateResponse(data);
	}
}

module.exports = ColorBecomesTagTest;
