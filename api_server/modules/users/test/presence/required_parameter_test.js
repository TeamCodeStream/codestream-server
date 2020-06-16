'use strict';

var PresenceTest = require('./presence_test');

class RequiredParameterTest extends PresenceTest {

	constructor (options) {
		super(options);
		this.dontFetchToVerify = true;
	}

	get description () {
		return `should return an error when the setting presence for a session with no ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// set the data to use when setting presence data
	setPresenceData (callback) {
		// set the presence data, but then delete the parameter in question
		super.setPresenceData(() => {
			delete this.presenceData[this.parameter];
			callback();
		});
	}
}

module.exports = RequiredParameterTest;
