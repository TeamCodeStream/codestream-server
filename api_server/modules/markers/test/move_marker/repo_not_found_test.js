'use strict';

const MoveTest = require('./move_test');
const ObjectId = require('mongodb').ObjectId;

class RepoNotFoundTest extends MoveTest {

	get description () {
		return 'should return an error when attempting to move the location for a marker and but with an unknown repo';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker repo'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.remotes;
			this.data.repoId = ObjectId();
			callback();
		});
	}
}

module.exports = RepoNotFoundTest;
