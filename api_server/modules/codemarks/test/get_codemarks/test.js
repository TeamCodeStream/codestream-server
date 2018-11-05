// handle unit tests for the "GET /codemarks" request to fetch knowledge base codemarks

'use strict';

const GetCodemarksTest = require('./get_codemarks_test');
const GetCodemarksWithMarkersTest = require('./get_codemarks_with_markers_test');
const GetCodemarksByTypeTest = require('./get_codemarks_by_type_test');
const GetPostlessCodemarksTest = require('./get_postless_codemarks_test');
const GetPostlessCodemarksByTypeTest = require('./get_postless_codemarks_by_type_test');
const GetPostlessCodemarksWithMarkersTest = require('./get_postless_codemarks_with_markers_test');
const GetCodemarksBeforeTest = require('./get_codemarks_before_test');
const GetCodemarksAfterTest = require('./get_codemarks_after_test');
//const ACLTest = require('./acl_test');

class GetCodemarksRequestTester {

	test () {
		new GetCodemarksTest().test();
		new GetCodemarksWithMarkersTest().test();
		new GetCodemarksByTypeTest().test();
		new GetPostlessCodemarksTest().test();
		new GetPostlessCodemarksByTypeTest().test();
		new GetPostlessCodemarksWithMarkersTest().test();
		new GetCodemarksBeforeTest().test();
		new GetCodemarksAfterTest().test();
		//new ACLTest().test();
	}
}

module.exports = new GetCodemarksRequestTester();
