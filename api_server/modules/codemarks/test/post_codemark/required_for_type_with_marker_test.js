'use strict';

const MarkerTest = require('./marker_test');

class RequiredForTypeWithMarkerTest extends MarkerTest {

	get description () {
		return `should return an error when attempting to create a ${this.codemarkType} codemark without ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require ${this.attribute}`
		};
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = RequiredForTypeWithMarkerTest;
