'use strict';

const GrantTest = require('./grant_test');

class InvalidChannelTest extends GrantTest {

	constructor (options) {
		super(options);
	}

	getExpectedError () {
		return {
			code: 'USRC-1008'
		};
	}

	get description () {
		return 'should return an error when requesting access to a channel with an invalid format';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// use a bogus format for the channel
		this.path = '/grant/xyz';
		callback();
	}
}

module.exports = InvalidChannelTest;
