'use strict';

const CodemarkTest = require('./codemark_test');

class ValidCodemarkTypeTest extends CodemarkTest {

	get description () {
		return `should return a valid codemark when creating a post with a codemark, of type ${this.codemarkType}`;
	}
}

module.exports = ValidCodemarkTypeTest;
