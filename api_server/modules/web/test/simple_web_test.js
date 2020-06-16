'use strict';

const WebTest = require('./web_test');
const Assert = require('assert');

class SimpleWebTest extends WebTest {

	get description () {
		return `should return the appropriate page when requesting ${this.route}`;
	}

	get path () {
		return this.route;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.notEqual(data.indexOf(this.text), -1, 'did not get expected text in the html response');
	}
}

module.exports = SimpleWebTest;
