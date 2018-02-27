'use strict';

var EditingTest = require('./editing_test');

class FindStreamTest extends EditingTest {

	get description () {
		return 'should return an op to update editingUsers when a user indicates they are editing the file for a stream, when the file is specified by path';
	}

	// before the test runs...
	before (callback) {
		// run standard set up for the test but delete the streamId and provide matching file instead
		super.before(() => {
			delete this.data.streamId;
			this.data.file = this.stream.file;
			callback();
		});
	}
}

module.exports = FindStreamTest;
