'use strict';

const UnpinPostTest = require('./unpin_post_test');

class ParameterRequiredTest extends UnpinPostTest {

	get description () {
		return `should return an error if trying to unpin a post from a codemark without setting ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(() => {
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
