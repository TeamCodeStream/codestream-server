'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class OneRelationalTest extends GetStreamsTest {

	get description () {
		return 'should return an error if more than one relational query parameter is provided for a streams query';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// try to fetch with both a "lt" and "gt" operator, which is forbidden 
		let id1 = ObjectID();
		let id2 = ObjectID();
		this.path = `/streams?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&lt=${id1}&gt=${id2}`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'only one relational parameter allowed'
		};
	}
}

module.exports = OneRelationalTest;
