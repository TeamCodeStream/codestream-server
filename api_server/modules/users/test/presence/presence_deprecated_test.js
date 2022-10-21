'use strict';

const PresenceTest = require('./presence_test');

class PresenceDeprecatedTest extends PresenceTest {

	constructor (options) {
		super(options);
		this.dontFetchToVerify = true;
	}
	
	get description () {
		return `should return error when attempting to update user presence, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = PresenceDeprecatedTest;
