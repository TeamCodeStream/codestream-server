'use strict';

// make jshint happy
/* globals describe */

var Authentication_Test = require('./authentication_test');
var Authentication_Missing_Authorization_Test = require('./authentication_missing_authorization_test');
var Authentication_Invalid_Token_Test = require('./authentication_invalid_token_test');
var Authentication_No_User_ID_Test = require('./authentication_no_user_id_test');
var Authentication_User_Not_Found_Test = require('./authentication_user_not_found_test');

describe('authentication', function() {

	new Authentication_Test().test();
	new Authentication_Missing_Authorization_Test().test();
	new Authentication_Invalid_Token_Test().test();
	new Authentication_No_User_ID_Test().test();
	new Authentication_User_Not_Found_Test().test();

});
