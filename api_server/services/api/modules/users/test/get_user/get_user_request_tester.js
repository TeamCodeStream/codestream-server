'use strict';

var Get_Myself_Test = require('./get_myself_test');
var Get_Other_User_Test = require('./get_other_user_test');
var Not_Found_Test = require('./not_found_test');

class Get_User_Request_Tester {

	get_user_test () {
		new Get_Myself_Test().test();
		new Get_Myself_Test({ id: 'me' }).test();
		new Get_Other_User_Test().test();
		new Not_Found_Test().test();
	}
}

module.exports = Get_User_Request_Tester;
