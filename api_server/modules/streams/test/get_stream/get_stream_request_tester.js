// handle unit tests for the "GET /streams/:id" request

'use strict';

const GetStreamTest = require('./get_stream_test');
//const GetPublicStreamTest = require('./get_public_stream_test');
const NotFoundTest = require('./not_found_test');
//const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');

class GetStreamRequestTester {

	getStreamTest () {
		new GetStreamTest({ type: 'file', mine: true }).test();
		new GetStreamTest({ type: 'team stream', mine: true }).test();
		new GetStreamTest({ type: 'object', mine: true }).test();
		new GetStreamTest({ type: 'file' }).test();
		new GetStreamTest({ type: 'team stream' }).test();
		new GetStreamTest({ type: 'object' }).test();
		//new GetStreamTest({ type: 'direct' }).test();
		//new GetStreamTest({ type: 'channel' }).test();
		//new GetPublicStreamTest({ type: 'channel' }).test();
		new NotFoundTest().test();
		//new ACLTest({ type: 'channel' }).test();
		//new ACLTest({ type: 'direct' }).test();
		new ACLTeamTest({ type: 'file' }).test();
		new ACLTeamTest({ type: 'team stream' }).test();
		new ACLTeamTest({ type: 'object' }).test();
		//new ACLTeamTest({ type: 'direct' }).test();
		//new ACLTeamTest({ type: 'channel' }).test();
	}
}

module.exports = GetStreamRequestTester;
