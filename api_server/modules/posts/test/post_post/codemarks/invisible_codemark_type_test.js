'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const RandomString = require('randomstring');

class InvisibleTypeTest extends CodemarkMarkerTest {

	get description () {
		return `should return an error when attempting to create a post with a ${this.codemarkType} codemark with a ${this.attribute} attribute`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks cannot have title or text`
		};
	}

	addCodemarkData (callback) {
		super.addCodemarkData(() => {
			this.data.codemark[this.attribute] = RandomString.generate(100);
			callback();
		});
	}
}

module.exports = InvisibleTypeTest;
