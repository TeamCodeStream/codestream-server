'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class NoStreamIdAndTypeTest extends GetCodemarksTest {

	get description () {
		return 'should return error if streamId and type are provided to codemarks query at the same time';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = `/codemarks?teamId=${this.team.id}&streamId=${this.teamStream.id}&type=comment`;
		callback();
	}
}

module.exports = NoStreamIdAndTypeTest;
