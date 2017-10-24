'use strict';

var Get_Stream_Test = require('./get_stream_test');

class ACL_Test extends Get_Stream_Test {

	constructor (options) {
		super(options);
		this.without_me = true;
	}

	get description () {
		return `should return an error when trying to fetch a ${this.type} stream from a team that i\'m not a member of`;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}
}

module.exports = ACL_Test;
