'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');

class FileStreamOnTheFlyTest extends DirectOnTheFlyTest {

	constructor (options) {
		super(options);
		this.streamType = 'file';
	}

	get description () {
		return 'should return a valid post and stream when creating a post and creating a file stream on the fly';
	}

	makePostOptions (callback) {
		this.streamOptions.repoId = this.repo._id;
		super.makePostOptions(callback);
	}
}

module.exports = FileStreamOnTheFlyTest;
