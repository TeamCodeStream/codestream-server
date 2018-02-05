'use strict';

var GrantTest = require('./grant_test');

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

	setPath (callback) {
		this.path = '/grant/xyz';
		callback();
	}
}

module.exports = InvalidChannelTest;
