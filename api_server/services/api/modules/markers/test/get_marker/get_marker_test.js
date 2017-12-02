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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPost,
			this.setPath
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		let streamOptions = {
			type: 'file',
			token: this.otherUserData.accessToken,
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

	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.markers[0];
				callback();
			},
			{
				token: this.mine ? this.token : this.otherUserData.accessToken,
				streamId: this.stream._id,
				repoId: this.repo._id,
				wantCodeBlocks: 1
			}
		);
	}

	setPath (callback) {
		this.path = '/markers/' + this.marker._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.marker._id, data.marker, 'marker');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkerTest;
