'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');
var ObjectID = require('mongodb').ObjectID;

class Invalid_Team_Id_Test extends Direct_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a direct stream on the fly with no team id';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.team_id = ObjectID();
			callback();
		});
	}
}

module.exports = Invalid_Team_Id_Test;
