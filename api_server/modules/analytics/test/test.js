// unit tests associated with the analytics module

'use strict';

// make eslint happy
/* globals describe */

const TelemetryKeyTest = require('./telemetry_key_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');

describe('analytics', function() {

	new TelemetryKeyTest().test();
	new NoSecretTest().test();
	new IncorrectSecretTest().test();

});
