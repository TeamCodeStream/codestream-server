// handle unit tests for the "POST /no-auth/gitlens-user" request to create a "GitLens user"

'use strict';

const GitLensUserTest = require('./gitlens_user_test');
const EmailHashesRequiredTest = require('./email_hashes_required_test');
const MachineIdOptionalTest = require('./machine_id_optional_test');
const ParameterTooLongTest = require('./parameter_too_long_test');
const MultipleEmailHashesTest = require('./multiple_email_hashes_test');
const TooManyEmailHashesTest = require('./too_many_email_hashes_test');

class GitLensUserRequestTester {

	test () {
		new GitLensUserTest().test();
		new EmailHashesRequiredTest().test();
		new MachineIdOptionalTest().test();
		new ParameterTooLongTest({ parameter: 'machineIdHash' }).test();
		new MultipleEmailHashesTest().test();
		new TooManyEmailHashesTest().test();
	}
}

module.exports = new GitLensUserRequestTester();
