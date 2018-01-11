'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NumMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 3;
		this.numCodeBlocks = 2;
	}

	get description () {
		// each time a post with code blocks is created in a stream, we increment an attribute
		// of the stream called numMarkers ... this is important for the client to know when
		// it has all the marker locations for a given stream
		return 'numMarkers for the stream should get incremented when a post is created in the stream with code blocks';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: ['numMarkers'] };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRepo,	// create a repo for the test
			this.createStream,	// create a stream in the repo
			this.createPosts	// create some posts in the stream
		], callback);
	}

	// create a repo for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// create a file-type stream in the repo we created
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.token
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				// for the test, we'll fetch the stream to confirm numMarkers has been incremented
				this.path = '/streams/' + this.stream._id;
				callback();
			},
			streamOptions
		);
	}

	// create some posts in the stream we created
	createPosts (callback) {
		BoundAsync.times(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream we created, with code blocks to increment numMarkers
	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.token,
			wantCodeBlocks: this.numCodeBlocks
		};
		this.postFactory.createRandomPost(callback, postOptions);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify that numMarkers is equal to the total number of code blocks 
		let numMarkers = this.numPosts * this.numCodeBlocks;
		Assert(numMarkers === data.stream.numMarkers, `numMarkers should be ${numMarkers}, but it is ${data.stream.numMarkers}`);
	}
}

module.exports = NumMarkersTest;
