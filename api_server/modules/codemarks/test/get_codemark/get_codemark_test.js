'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodemarkTestConstants = require('../codemark_test_constants');

class GetCodemarkTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		Object.assign(this.streamOptions, {
			type: this.type || 'channel',
			creatorIndex: 1
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodemark: true
		});
	}

	get description () {
		return 'should return the codemark when requesting an codemark';
	}

	getExpectedFields () {
		return { codemark: CodemarkTestConstants.EXPECTED_CODEMARK_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the codemark
		this.codemark = this.postData[0].codemark;
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct codemark, and that we only got sanitized attributes
		this.validateMatchingObject(this.codemark.id, data.codemark, 'codemark');
		this.validateSanitized(data.codemark, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent post, with only sanitized attributes
		if (this.postData[0]) {
			this.validateMatchingObject(this.postData[0].post.id, data.post, 'post');
			this.validateSanitized(data.post, CodemarkTestConstants.UNSANITIZED_POST_ATTRIBUTES);
		}
	}
}

module.exports = GetCodemarkTest;
