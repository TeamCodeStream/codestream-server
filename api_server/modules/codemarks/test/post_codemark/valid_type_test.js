'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class ValidTypeTest extends PostCodemarkTest {

	get description () {
		return `should return a valid codemark when creating an codemark tied to a third-party post, of type ${this.codemarkType}`;
	}
}

module.exports = ValidTypeTest;
