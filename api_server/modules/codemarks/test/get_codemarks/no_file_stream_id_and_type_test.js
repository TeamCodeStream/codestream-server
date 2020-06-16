'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class NoFileStreamIdAndTypeTest extends GetCodemarksTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return error if fileStreamId and type are provided to codemarks query at the same time';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = `/codemarks?teamId=${this.team.id}&fileStreamId=${this.repoStreams[0].id}&type=comment`;
		callback();
	}
}

module.exports = NoFileStreamIdAndTypeTest;
