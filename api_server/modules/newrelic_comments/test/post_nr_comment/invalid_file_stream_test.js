'use strict';

const MoveTest = require('./move_test');

class InvalidFileStreamTest extends MoveTest {

	get description () {
		return 'should return an error when attempting to move the location for a marker pointing to a stream that is not a file stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'marker stream must be a file-type stream'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.file;
			this.data.fileStreamId = this.teamStream.id;
			callback();
		});
	}
}

module.exports = InvalidFileStreamTest;
