'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var ObjectID = require('mongodb').ObjectID;

class Not_Found_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error when trying to fetch a repo that doesn\'t exist';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003'
		};
	}

	before (callback) {
		this.path = '/repos/' + ObjectID();
		callback();
	}
}

module.exports = Not_Found_Test;
