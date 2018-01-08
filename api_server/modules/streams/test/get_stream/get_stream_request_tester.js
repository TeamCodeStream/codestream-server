'use strict';

var GetMyFileStreamTest = require('./get_my_file_stream_test');
var GetMyChannelStreamTest = require('./get_my_channel_stream_test');
var GetMyDirectStreamTest = require('./get_my_direct_stream_test');
var GetOtherFileStreamTest = require('./get_other_file_stream_test');
var GetOtherChannelStreamTest = require('./get_other_channel_stream_test');
var GetOtherDirectStreamTest = require('./get_other_direct_stream_test');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');

class GetStreamRequestTester {

	getStreamTest () {
		new GetMyFileStreamTest().test();
		new GetMyChannelStreamTest().test();
		new GetMyDirectStreamTest().test();
		new GetOtherFileStreamTest().test();
		new GetOtherChannelStreamTest().test();
		new GetOtherDirectStreamTest().test();
		new NotFoundTest().test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'file' }).test();
	}
}

module.exports = GetStreamRequestTester;
