'use strict';

var ReadTest = require('./read_test');
var ReadAllTest = require('./read_all_test');
var ReadACLTest = require('./read_acl_test');
var ReadMessageTest = require('./read_message_test');
var ReadAllMessageTest = require('./read_all_message_test');

class ReadRequestTester {

	readTest () {
		new ReadTest().test();
		new ReadAllTest().test();
		new ReadACLTest().test();
		new ReadMessageTest().test();
		new ReadAllMessageTest().test();
	}
}

module.exports = ReadRequestTester;
