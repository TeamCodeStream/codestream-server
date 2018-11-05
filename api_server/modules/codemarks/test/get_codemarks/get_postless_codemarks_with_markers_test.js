'use strict';

const GetPostlessCodeMarksTest = require('./get_postless_codemarks_test');

class GetPostlessCodeMarksWithMarkersTest extends GetPostlessCodeMarksTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the correct codemarks with markers when requesting codemarks for a team that were created with associated markers for a team and the codemarks are for third-party provider';
	}
}

module.exports = GetPostlessCodeMarksWithMarkersTest;
