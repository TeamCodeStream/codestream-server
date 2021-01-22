// handle unit tests for the "POST /no-auth/gitlens-user" request to create a "GitLens user"

'use strict';

const GitLensUserTest = require('./gitlens_user_test');
const EmailHashRequiredTest = require('./email_hash_required_test');
const MachineIdOptionalTest = require('./machine_id_optional_test');
const ParameterTooLongTest = require('./parameter_too_long_test');

class GitLensUserRequestTester {

	test () {
		new GitLensUserTest().test();
		new EmailHashRequiredTest().test();
		new MachineIdOptionalTest().test();
		new ParameterTooLongTest({ parameter: 'emailHash' }).test();
		new ParameterTooLongTest({ parameter: 'machineIdHash' }).test();
	}
}

module.exports = new GitLensUserRequestTester();
