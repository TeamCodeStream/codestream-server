'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class OneRelationalTest extends GetStreamsTest {

	get description () {
		return 'should return an error if more than one relational query parameter is provided';
	}

	setPath (callback) {
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
