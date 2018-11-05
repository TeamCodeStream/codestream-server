// base class for many tests of the "POST /codemarks" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CodeMarkTestConstants = require('../codemark_test_constants');
const CommonInit = require('./common_init');
const CodeMarkValidator = require('./codemark_validator');

class PostCodeMarkTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectProviderType = true;
	}

	get description () {
		return 'should return a valid codemark when creating an codemark tied to a third-party post';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/codemarks';
	}

	getExpectedFields () {
		const expectedFields = CodeMarkTestConstants.EXPECTED_CODEMARK_FIELDS;
		return { codemark: expectedFields };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// verify we got back an codemark with the attributes we specified
		new CodeMarkValidator({
			test: this,
			inputCodeMark: this.data
		}).validateCodeMark(data);
	}
}

module.exports = PostCodeMarkTest;
