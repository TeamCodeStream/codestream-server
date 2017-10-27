'use strict';

var Get_Posts_Test = require('./get_posts_test');

class ACL_Team_File_Test extends Get_Posts_Test {

	constructor (options) {
		super(options);
		this.without_me_on_team = true;
		this.type = 'file';
	}

	get description () {
		return 'should return an error when trying to fetch posts from a file stream in a team i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACL_Team_File_Test;
