'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const MarkerTestConstants = require('../marker_test_constants');

class GetMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 5;
	}

	get description () {
		return 'should return the correct markers when requesting markers for a stream';
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPosts,
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
				this.team = response.team;
				callback();
			},
			{
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				token: this.otherUserData.accessToken,
				teamId: this.repo.teamId,
				repoId: this.repo._id
			}
		);
	}

	createPosts (callback) {
		this.markers = [];
		this.locations = {};
		this.commitHash = this.postFactory.randomCommitHash();
		BoundAsync.timesSeries(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	createPost (n, callback) {
		let postOptions = this.setPostOptions(n);
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				let marker = response.markers[0];
				this.markers.push(marker);
				this.locations[marker._id] = response.markerLocations.locations[marker._id];
				callback();
			},
			postOptions
		);
	}

	setPostOptions (n) {
		let iAmInStream = !this.withoutMe;
		let mine = iAmInStream && n % 2 === 1;
		let postOptions = {
			token: mine ? this.token : this.otherUserData.accessToken,
			streamId: this.stream._id,
			wantCodeBlocks: 1,
			commitHash: this.commitHash
		};
		return postOptions;
	}

	getQueryParameters () {
		return {
			teamId: this.team._id,
			streamId: this.stream._id
		};
	}

	setPath (callback) {
		let queryParameters = this.getQueryParameters();
		this.path = '/markers?' + Object.keys(queryParameters).map(parameter => {
			let value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObjects(data.markers, this.markers, 'markers');
		this.validateSanitizedObjects(data.markers, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMarkersTest;
