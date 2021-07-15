'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeErrorTestConstants = require('../code_error_test_constants');
const Assert = require('assert');

class GetCodeErrorsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 10,
			creatorIndex: 1,
			wantCodeError: true
		});
	}

	get description () {
		return 'should return the correct code errors when requesting code errors for a team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setCodeErrors,
			this.setPath
		], callback);
	}

	// set the code errors established for the test
	setCodeErrors (callback) {
		this.codeErrors = this.postData.map(postData => postData.codeError);
		callback();
	}

	// set the path to use for the request
	setPath (callback) {
		this.expectedCodeErrors = [...this.codeErrors];
		this.expectedCodeErrors.reverse();
		this.path = `/code-errors?teamId=${this.team.id}`;
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct code errors, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjectsSorted(data.codeErrors, this.expectedCodeErrors, 'code errors');
		this.validateSanitizedObjects(data.codeErrors, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure we got a post with each code error that matches the post to which the code error belongs
		data.codeErrors.forEach(codeError => {
			const post = data.posts.find(post => post.id === codeError.postId);
			Assert(post, 'no post found for marker\'s code error');
			if (this.postOptions.wantMarkers) {
				codeError.markerIds.forEach(markerId => {
					const marker = data.markers.find(marker => marker.id === markerId);
					Assert(marker, `no marker found for code error's marker ${markerId}`);
				});
			}
		});
	}
}

module.exports = GetCodeErrorsTest;
