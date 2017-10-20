'use strict';

var Get_Post_Test = require('./get_post_test');
var Not_Found_Test = require('./not_found_test');

class Get_Post_Request_Tester {

	get_post_test () {
		new Get_Post_Test({type: 'channel', mine: true}).test();
		new Get_Post_Test({type: 'direct', mine: true}).test();
		new Get_Post_Test({type: 'file', mine: true}).test();
		new Get_Post_Test({type: 'channel'}).test();
		new Get_Post_Test({type: 'direct'}).test();
		new Get_Post_Test({type: 'file'}).test();
		new Not_Found_Test().test();
	}
}

module.exports = Get_Post_Request_Tester;
