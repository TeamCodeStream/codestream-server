'use strict';

const MoveTest = require('./move_test');
const ObjectId = require('mongodb').ObjectId;

class StreamNotFoundTest extends MoveTest {

	get description () {
		return 'should return an error when attempting to move the location for a marker and but with an unknown stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.file;
			this.data.fileStreamId = ObjectId();
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
