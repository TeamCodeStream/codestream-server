'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class ValidCodemarkTypeWithMarkerTest extends CodemarkMarkerTest {

	get description () {
		return `should return a valid codemark when creating a post and codemark with a marker, of type ${this.codemarkType}`;
	}
}

module.exports = ValidCodemarkTypeWithMarkerTest;
