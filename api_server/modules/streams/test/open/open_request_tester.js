// handle unit tests for the "PUT /open" request

'use strict';

const OpenTest = require('./open_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const MustBeDirectTest = require('./must_be_direct_test');
const MessageToUserTest = require('./message_to_user_test');
const GetStreamTest = require('./get_stream_test');
const GetStreamsTest = require('./get_streams_test');
const OpenStreamDeprecatedTest = require('./open_stream_deprecated_test');

class OpenRequestTester {

	openTest () {
		new OpenStreamDeprecatedTest().test();
		/*
		new OpenTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new StreamNotFoundTest().test();
		new MustBeDirectTest().test();
		new MessageToUserTest().test();
		new GetStreamTest().test();
		new GetStreamsTest().test();
		*/
	}
}

module.exports = OpenRequestTester;
