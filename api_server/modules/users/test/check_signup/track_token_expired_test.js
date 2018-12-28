'use strict';

const TrackingTest = require('./tracking_test');

class TrackTokenExpiredTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000;
		this.waitTime = 2000;
		this.expectedError = 'Token Expired';
	}

	get description () {
		return 'should send a Continue Into IDE Failed event for tracking purposes when a call is made to check signup status of an expired token';
	}
}

module.exports = TrackTokenExpiredTest;
