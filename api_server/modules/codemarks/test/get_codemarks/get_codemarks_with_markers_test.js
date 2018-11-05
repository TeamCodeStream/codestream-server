'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class GetCodemarksWithMarkersTest extends GetCodemarksTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should return the correct codemarks with markers when requesting codemarks for a team that were created with associated markers';
	}
}

module.exports = GetCodemarksWithMarkersTest;
