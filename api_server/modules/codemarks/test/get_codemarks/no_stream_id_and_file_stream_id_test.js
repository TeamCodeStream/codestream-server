'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class NoStreamIdAndFileStreamIdTest extends GetCodemarksTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return error if fileStreamId and streamId are provided to codemarks query at the same time';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = `/codemarks?teamId=${this.team._id}&fileStreamId=${this.repoStreams[0]._id}&streamId=${this.stream._id}`;
		callback();
	}
}

module.exports = NoStreamIdAndFileStreamIdTest;
