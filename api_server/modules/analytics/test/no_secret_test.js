'use strict';

const TelemetryKeyTest = require('./telemetry_key_test');

class NoSecretTest extends TelemetryKeyTest {

	get description () {
		return 'should return an error when an attempt is made to fetch the telemetry key without providing a secret';
	}

	getExpectedError () {
		return {
			error: 'incorrect telemetry secret'
		};
	}

	get path () {
		return '/no-auth/telemetry-key';
	}
}

module.exports = NoSecretTest;
