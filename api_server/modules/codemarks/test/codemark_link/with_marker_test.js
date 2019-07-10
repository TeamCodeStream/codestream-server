// base class for many tests of the "POST /codemark/:id/permalink" requests

'use strict';

const CodemarkLinkTest = require('./codemark_link_test');

class WithMarkerTest extends CodemarkLinkTest {

	constructor (options) {
		super(options);
		this.wantMarkers = 1;
	}
}

module.exports = WithMarkerTest;
