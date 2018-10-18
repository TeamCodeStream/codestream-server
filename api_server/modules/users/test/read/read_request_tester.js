// handle unit tests for the "PUT /read/:streamId" request, indicating a user
// is "caught up" reading the messages in a stream

'use strict';

const ReadTest = require('./read_test');
const ReadFetchTest = require('./read_fetch_test');
const ReadAllTest = require('./read_all_test');
const ReadAllFetchTest = require('./read_all_fetch_test');
const ReadACLTest = require('./read_acl_test');
const ReadMessageTest = require('./read_message_test');
const ReadAllMessageTest = require('./read_all_message_test');
const StreamNotFoundTest = require('./stream_not_found_test');

class ReadRequestTester {

	readTest () {
		new ReadTest().test();
		new ReadFetchTest().test();
		new ReadAllTest().test();
		new ReadAllFetchTest().test();
		new ReadACLTest().test();
		new ReadMessageTest().test();
		new ReadAllMessageTest().test();
		new StreamNotFoundTest().test();
	}
}

module.exports = ReadRequestTester;
