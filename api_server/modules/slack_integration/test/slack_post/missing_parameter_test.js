'use strict';

var SlackPostTest = require('./slack_post_test');

class MissingParameterTest extends SlackPostTest {

	get description () {
		return `should return an error when trying to send a slack post request without providing the ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			delete this.data[this.parameter];	// remove the parameter
			callback();
		});
	}
}

module.exports = MissingParameterTest;
