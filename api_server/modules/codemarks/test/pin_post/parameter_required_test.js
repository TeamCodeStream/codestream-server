'use strict';

const PinPostTest = require('./pin_post_test');

class ParameterRequiredTest extends PinPostTest {

	get description () {
		return `should return an error if trying to pin a post to a codemark without setting ${this.parameter}`;
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
