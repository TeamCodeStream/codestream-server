'use strict';

const AlreadyRegisteredEmailTest = require('./already_registered_email_test');

class AlreadyRegisteredOneUserPerOrgTest extends AlreadyRegisteredEmailTest {

	get description () {
		return 'should send an already-registered email when a user registers and that user is already registered, under one-user-per-org paradigm';
	}
}

module.exports = AlreadyRegisteredOneUserPerOrgTest;
