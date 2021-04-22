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
const GetCodemarksBeforeInclusiveTest = require('./get_codemarks_before_inclusive_test');
const GetCodemarksAfterInclusiveTest = require('./get_codemarks_after_inclusive_test');
const GetCodemarksBeforeAfterTest = require('./get_codemarks_before_after_test');
const GetCodemarksBeforeAfterInclusiveTest = require('./get_codemarks_before_after_inclusive_test');
const ACLTest = require('./acl_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const TeamNotFoundTest = require('./team_not_found_test');
const NoStreamIdAndTypeTest = require('./no_stream_id_and_type_test');
const NoFileStreamIdAndTypeTest = require('./no_file_stream_id_and_type_test');
const NoStreamIdAndFileStreamIdTest = require('./no_stream_id_and_file_stream_id_test');
//const GetCodemarksByStreamIdTest = require('./get_codemarks_by_stream_id_test');
const GetCodemarksByFileStreamIdTest = require('./get_codemarks_by_file_stream_id_test');
const GetCodemarksByLastActivityTest = require('./get_codemarks_by_last_activity_test');
const GetCodemarksBeforeLastActivityTest = require('./get_codemarks_before_last_activity_test');
const GetCodemarksAfterLastActivityTest = require('./get_codemarks_after_last_activity_test');
const GetCodemarksBeforeLastActivityInclusiveTest = require('./get_codemarks_before_last_activity_inclusive_test');
const GetCodemarksAfterLastActivityInclusiveTest = require('./get_codemarks_after_last_activity_inclusive_test');
const GetCodemarksBeforeAfterLastActivityTest = require('./get_codemarks_before_after_last_activity_test');
const GetCodemarksBeforeAfterLastActivityInclusiveTest = require('./get_codemarks_before_after_last_activity_inclusive_test');

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
		new GetCodemarksBeforeInclusiveTest().test();
		new GetCodemarksAfterInclusiveTest().test();
		new GetCodemarksBeforeAfterTest().test();
		new GetCodemarksBeforeAfterInclusiveTest().test();
		new ACLTest().test();
		new TeamIDRequiredTest().test();
		new TeamNotFoundTest().test();
		new NoStreamIdAndTypeTest().test();
		new NoFileStreamIdAndTypeTest().test();
		new NoStreamIdAndFileStreamIdTest().test();
		//new GetCodemarksByStreamIdTest().test();
		new GetCodemarksByFileStreamIdTest().test();
		new GetCodemarksByLastActivityTest().test();
		new GetCodemarksBeforeLastActivityTest().test();
		new GetCodemarksAfterLastActivityTest().test();
		new GetCodemarksBeforeLastActivityInclusiveTest().test();
		new GetCodemarksAfterLastActivityInclusiveTest().test();
		new GetCodemarksBeforeAfterLastActivityTest().test();
		new GetCodemarksBeforeAfterLastActivityInclusiveTest().test();
	}
}

module.exports = new GetCodemarksRequestTester();
