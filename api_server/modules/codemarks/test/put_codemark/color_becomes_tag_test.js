'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class ColorBecomesTagTest extends PutCodemarkTest {

	get description () {
		return 'when updating a codemark and setting a color, that color should become a tag';
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.data.color = 'red';
			this.expectedData.codemark.$set.color = 'red';
			this.expectedData.codemark.$set.tags = ['_red'];
			callback();
		});
	}
}

module.exports = ColorBecomesTagTest;