// handle unit tests for the "GET /streams/:id" request

'use strict';

const GetMyFileStreamTest = require('./get_my_file_stream_test');
const GetMyChannelStreamTest = require('./get_my_channel_stream_test');
const GetMyDirectStreamTest = require('./get_my_direct_stream_test');
const GetOtherFileStreamTest = require('./get_other_file_stream_test');
const GetOtherChannelStreamTest = require('./get_other_channel_stream_test');
const GetOtherDirectStreamTest = require('./get_other_direct_stream_test');
const GetPublicStreamTest = require('./get_public_stream_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');

class GetStreamRequestTester {

	getStreamTest () {
		new GetMyFileStreamTest().test();
		new GetMyChannelStreamTest().test();
		new GetMyDirectStreamTest().test();
		new GetOtherFileStreamTest().test();
		new GetOtherChannelStreamTest().test();
		new GetOtherDirectStreamTest().test();
		new GetPublicStreamTest().test();
		new NotFoundTest().test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'file' }).test();
	}
}

module.exports = GetStreamRequestTester;
