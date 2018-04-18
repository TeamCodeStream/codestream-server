'use strict';

var TeamsPostTest = require('./teams_post_test');

class MissingParameterTest extends TeamsPostTest {

	get description () {
		return `should return an error when trying to send a teams post request without providing the ${this.parameter} parameter`;
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
