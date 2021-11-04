// handle unit tests for the "GET /streams/:id" request

'use strict';

const GetStreamTest = require('./get_stream_test');
const GetOtherStreamTest = require('./get_other_stream_test');
//const GetPublicStreamTest = require('./get_public_stream_test');
const GetTeamStreamTest = require('./get_team_stream_test');
const NotFoundTest = require('./not_found_test');
//const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');

class GetStreamRequestTester {

	getStreamTest () {
		new GetStreamTest({ type: 'file' }).test();
		//new GetStreamTest({ type: 'direct' }).test();
		//new GetStreamTest({ type: 'channel' }).test();
		new GetOtherStreamTest({ type: 'file' }).test();
		//new GetOtherStreamTest({ type: 'direct' }).test();
		//new GetOtherStreamTest({ type: 'channel' }).test();
		//new GetPublicStreamTest({ type: 'channel' }).test();
		new GetTeamStreamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
		//new ACLTest({ type: 'channel' }).test();
		//new ACLTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'file' }).test();
		//new ACLTeamTest({ type: 'direct' }).test();
		//new ACLTeamTest({ type: 'channel' }).test();
	}
}

module.exports = GetStreamRequestTester;
