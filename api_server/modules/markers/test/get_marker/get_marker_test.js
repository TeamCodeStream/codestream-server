'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const MarkerTestConstants = require('../marker_test_constants');

class GetMarkerTest extends CodeStreamAPITest {

	get description () {
		return 'should return the marker when requesting a marker';
	}

	getExpectedFields () {
		return { marker: MarkerTestConstants.EXPECTED_MARKER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another user
			this.createRepo,		// create a repo as the other user
			this.createStream,		// create a stream as the other user
			this.createPost,		// create a post with a single code block, making a marker
			this.setPath			// set the path for the request
		], callback);
	}

	// create another (registered) user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo as the other user
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,	// add a couple of users
				withEmails: this.withoutMe ? null : [this.currentUser.email],	// add me or not, depending on the test
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// create a file stream in the repo
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			token: this.otherUserData.accessToken,	// the other user will be the creator
			teamId: this.repo.teamId,
			repoId: this.repo._id,
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a post in the stream, with a code block, which will create a marker
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.markers[0];
				callback();
			},
			{
				token: this.mine ? this.token : this.otherUserData.accessToken,	// the other user will be the creator
				streamId: this.stream._id,
				repoId: this.repo._id,
				wantCodeBlocks: 1	// we have 1 code block, this gives us a marker
			}
		);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the marker
		this.path = '/markers/' + this.marker._id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct marker, and that we only got sanitized attributes
		this.validateMatchingObject(this.marker._id, data.marker, 'marker');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkerTest;
