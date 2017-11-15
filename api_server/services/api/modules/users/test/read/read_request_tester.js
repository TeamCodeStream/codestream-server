'use strict';

var Read_Test = require('./read_test');
var Read_All_Test = require('./read_all_test');
var Read_ACL_Test = require('./read_acl_test');
var Read_Message_Test = require('./read_message_test');
var Read_All_Message_Test = require('./read_all_message_test');

class Read_Request_Tester {

	read_test () {
		new Read_Test().test();
		new Read_All_Test().test();
		new Read_ACL_Test().test();
		new Read_Message_Test().test();
		new Read_All_Message_Test().test();
	}
}

module.exports = Read_Request_Tester;
