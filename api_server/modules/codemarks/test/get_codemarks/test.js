// handle unit tests for the "GET /codemarks" request to fetch knowledge base codemarks

'use strict';

const GetCodeMarksTest = require('./get_codemarks_test');
const GetCodeMarksWithMarkersTest = require('./get_codemarks_with_markers_test');
const GetCodeMarksByTypeTest = require('./get_codemarks_by_type_test');
const GetPostlessCodeMarksTest = require('./get_postless_codemarks_test');
const GetPostlessCodeMarksByTypeTest = require('./get_postless_codemarks_by_type_test');
const GetPostlessCodeMarksWithMarkersTest = require('./get_postless_codemarks_with_markers_test');
const GetCodeMarksBeforeTest = require('./get_codemarks_before_test');
const GetCodeMarksAfterTest = require('./get_codemarks_after_test');
//const ACLTest = require('./acl_test');

class GetCodeMarksRequestTester {

	test () {
		new GetCodeMarksTest().test();
		new GetCodeMarksWithMarkersTest().test();
		new GetCodeMarksByTypeTest().test();
		new GetPostlessCodeMarksTest().test();
		new GetPostlessCodeMarksByTypeTest().test();
		new GetPostlessCodeMarksWithMarkersTest().test();
		new GetCodeMarksBeforeTest().test();
		new GetCodeMarksAfterTest().test();
		//new ACLTest().test();
	}
}

module.exports = new GetCodeMarksRequestTester();
