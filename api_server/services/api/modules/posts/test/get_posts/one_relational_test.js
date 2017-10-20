'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var ObjectID = require('mongodb').ObjectID;

class One_Relational_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error if more than one relational query parameter is provided';
	}

	get path () {
		let id1 = ObjectID();
		let id2 = ObjectID();
		return `/posts?lt=${id1}&gt=${id2}`;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'only one relational parameter allowed'
		};
	}
}

module.exports = One_Relational_Test;
