'use strict';

var Confirmation_Test = require('./confirmation_test');
var ObjectID = require('mongodb').ObjectID;

class Confirmation_Invalid_User_Id_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when confirming a registration with an invalid user ID';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003'
		};
	}

	before (callback) {
		super.before(() => {
			this.data.user_id = ObjectID();
			callback();
		});
	}
}

module.exports = Confirmation_Invalid_User_Id_Test;
