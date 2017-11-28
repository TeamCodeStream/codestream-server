'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NumMarkersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numPosts = 3;
		this.numCodeBlocks = 2;
	}

	get description () {
		return 'numMarkers for the stream should get incremented when a post is created in the stream with code blocks';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: ['numMarkers'] };
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream,
			this.createPosts
		], callback);
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
				token: this.token
			}
		);
	}

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
				this.path = '/streams/' + this.stream._id;
				callback();
			},
			streamOptions
		);
	}

	createPosts (callback) {
		BoundAsync.times(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.token,
			wantCodeBlocks: this.numCodeBlocks
		};
		this.postFactory.createRandomPost(callback, postOptions);
	}

	validateResponse (data) {
		let numMarkers = this.numPosts * this.numCodeBlocks;
		Assert(numMarkers === data.stream.numMarkers, `numMarkers should be ${numMarkers}, but it is ${data.stream.numMarkers}`);
	}
}

module.exports = NumMarkersTest;
