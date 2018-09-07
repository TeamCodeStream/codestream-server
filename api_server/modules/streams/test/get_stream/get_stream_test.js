// provide base class for most tests testing the "GET /streams/:id" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { stream: StreamTestConstants.EXPECTED_STREAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a repo to use for the test
			this.createStream,		// create a stream in that repo
			this.setPath			// set the path to use when issuing the request
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (and team) to use for the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few extra users for good measure
				withEmails: this.withoutMe ? null : [this.currentUser.email],	// i may or not be part of the team
				token: this.otherUserData.accessToken	// the "other" user creates the repo and team
			}
		);
	}

	// create a stream to use for the test
	createStream (callback) {
		let streamOptions = {
			type: this.type,
			token: this.mine ? this.token : this.otherUserData.accessToken,	// i or the other user creates the stream, depending on the test
			teamId: this.repo.teamId,
			repoId: this.type === 'file' ? this.repo._id : null	// file-type streams must have repo ID
		};
		if (this.privacy) {
			streamOptions.privacy = this.privacy;
		}
		if (this.type !== 'file' && !this.mine && !this.withoutMe && !this.withoutMeInStream) {	
			// add me to the stream if it is not a file-type stream (which don't have members),
			// if i am not creating it (in which case i'm added anyway), and if the test wants me
			streamOptions.memberIds = [this.currentUser._id];
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// set the path to use when issuing the request
	setPath (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got back the stream we created, and make sure there are no attributes that should not be seen by clients
		this.validateMatchingObject(this.stream._id, data.stream, 'stream');
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamTest;
