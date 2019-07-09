'use strict';

const MarkerTest = require('./marker_test');
const RandomString = require('randomstring');

class InvisibleTypeTest extends MarkerTest {

	get description () {
		return `should return an error when attempting to create a ${this.codemarkType} codemark with a ${this.attribute} attribute`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks cannot have title or text`
		};
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data[this.attribute] = RandomString.generate(100);
			callback();
		});
	}
}

module.exports = InvisibleTypeTest;
