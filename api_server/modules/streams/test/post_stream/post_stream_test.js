// provide a base class for many of the tests of the "POST /streams" request to create a stream
'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
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

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.makeRandomEmails,		// make some random emails, to be added to the test team and some streams
			this.createRandomRepo,		// make a repo (and a team), with some of the users as members
			this.makeStreamOptions,		// make options to use in issuing the test request to create a stream
			this.createDuplicateStream,	// if needed, create a stream, before the test request, that duplicates the attributes of the stream we will create for the test
			this.makeStreamData			// make the data to use when issuing the request
		], callback);
	}

	// make some random emails, these will be added as users in the team that owns the stream 
	// created during the test
	makeRandomEmails (callback) {
		for (let i = 0; i < 3; i++) {
			this.teamEmails.push(this.userFactory.randomEmail());
		}
		callback();
	}

	// create a repo (which creates a team)
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
				withEmails: this.teamEmails,	// add users whose emails we generated
				token: this.token				// current user creates the team
			}
		);
	}

	// make options to use in issuing the test request to create a stream
	makeStreamOptions (callback) {
		this.streamOptions = {
			type: this.type,		// stream type
			teamId: this.team._id	// ID of the team to own the stream
		};
		callback();
	}

	// if needed, create a stream, before the test request, 
	// that duplicates the attributes of the stream we will create for the test
	createDuplicateStream (callback) {
		if (!this.testOptions.wantDuplicateStream) {	// only if needed for the test
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

	// make the data to use when issuing the request
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

	// validate the response to the test request
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
