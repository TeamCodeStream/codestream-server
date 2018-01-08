'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class PostStreamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.testOptions = {};
		this.teamEmails = [];
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get description () {
		return `should return a valid stream when creating a new ${this.type} stream`;
	}

	getExpectedFields () {
		return StreamTestConstants.EXPECTED_STREAM_RESPONSE;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.makeRandomEmails,
			this.createRandomRepo,
			this.makeStreamOptions,
			this.createDuplicateStream,
			this.makeStreamData
		], callback);
	}

	makeRandomEmails (callback) {
		for (let i = 0; i < 3; i++) {
			this.teamEmails.push(this.userFactory.randomEmail());
		}
		callback();
	}

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails: this.teamEmails,
				token: this.token
			}
		);
	}

	makeStreamOptions (callback) {
		this.streamOptions = {
			type: this.type,
			teamId: this.team._id
		};
		callback();
	}

	createDuplicateStream (callback) {
		if (!this.testOptions.wantDuplicateStream) {
			return callback();
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			Object.assign({}, this.streamOptions, { token: this.token })
		);
	}

	makeStreamData (callback) {
		this.streamFactory.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.streamOptions
		);
	}

	validateResponse (data) {
		let stream = data.stream;
		let errors = [];
		let result = (
			((stream.type === this.data.type) || errors.push('type does not match')) &&
			((stream.teamId === this.data.teamId) || errors.push('teamId does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((stream.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostStreamTest;
