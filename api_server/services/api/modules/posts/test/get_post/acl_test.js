'use strict';

var Get_Post_Test = require('./get_post_test');

class ACL_Test extends Get_Post_Test {

	constructor (options) {
		super(options);
		this.without_me = true;
	}

	get description () {
		return `should return an error when trying to fetch a post from a ${this.type} stream from a team that i\'m not a member of`;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		this.path = '/posts/' + this.post._id;
		callback();
	}
}

module.exports = ACL_Test;
