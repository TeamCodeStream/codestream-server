'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeMarkTestConstants = require('../codemark_test_constants');
const Assert = require('assert');

class GetCodeMarksTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 10,
			creatorIndex: 1,
			wantCodeMark: true,
			codemarkTypes: ['question', 'issue', 'codetrap'],
			assignedTypes: [0, 1, 2, 1, 2, 0, 2, 1, 1, 0]
		});
	}

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setCodeMarks,
			this.setPath
		], callback);
	}

	// set the codemarks established for the test
	setCodeMarks (callback) {
		this.codemarks = this.postData.map(postData => postData.codemark);
		if (this.repoCodeMark) {
			this.codemarks.push(this.repoCodeMark);
		}
		callback();
	}

	// set the path to use for the request
	setPath (callback) {
		this.expectedCodeMarks = this.codemarks;
		this.path = `/codemarks?teamId=${this.team._id}`;
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct codemarks, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.codemarks, this.expectedCodeMarks, 'codemarks');
		this.validateSanitizedObjects(data.codemarks, CodeMarkTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure we got a post with each codemark that matches the post to which the codemark belongs
		data.codemarks.forEach(codemark => {
			if (!codemark.providerType) {
				const post = data.posts.find(post => post._id === codemark.postId);
				Assert(post, 'no post found for marker\'s codemark');
			}
			if (this.postOptions.wantMarker) {
				codemark.markerIds.forEach(markerId => {
					const marker = data.markers.find(marker => marker._id === markerId);
					Assert(marker, 'no marker found for codemark\'s marker');
				});
			}
		});
	}
}

module.exports = GetCodeMarksTest;
