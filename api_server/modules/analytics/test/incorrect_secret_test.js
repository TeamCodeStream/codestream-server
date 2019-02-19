'use strict';

const TelemetryKeyTest = require('./telemetry_key_test');

class IncorrectSecretTest extends TelemetryKeyTest {

	get description () {
		return 'should return an error when an attempt is made to fetch the telemetry key with an incorrect secret';
	}

	getExpectedError () {
		return {
			error: 'incorrect telemetry secret'
		};
	}

	get path () {
		return '/no-auth/telemetry-key?secret=abc123';
	}
}

module.exports = IncorrectSecretTest;
