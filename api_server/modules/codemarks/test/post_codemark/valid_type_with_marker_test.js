'use strict';

const MarkerTest = require('./marker_test');

class ValidTypeWithMarkerTest extends MarkerTest {

	get description () {
		return `should return a valid codemark when creating a codemark with a marker, tied to a third-party post, of type ${this.codemarkType}`;
	}
}

module.exports = ValidTypeWithMarkerTest;
