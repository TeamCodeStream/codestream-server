'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const StreamTestConstants = require('../stream_test_constants');

class GetStreamTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { stream: StreamTestConstants.EXPECTED_STREAM_FIELDS };
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
			this.createStream,
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

	createRandomRepo (callback) {
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
			type: this.type,
			token: this.mine ? this.token : this.otherUserData.accessToken,
			teamId: this.repo.teamId,
			repoId: this.type === 'file' ? this.repo._id : null,
		};
		if (this.type !== 'file' && !this.mine && !this.withoutMe) {
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

	setPath (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.stream._id, data.stream, 'stream');
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetStreamTest;
