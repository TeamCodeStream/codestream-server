'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class CommitHashRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if commitHash is not provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'commitHash required'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream,
			this.createPost
		], callback);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				this.path = `/markers?teamId=${this.team._id}&streamId=${this.stream._id}`;
				callback();
			},
			{
				type: 'file',
				token: this.token,
				teamId: this.repo.teamId,
				repoId: this.repo._id
			}
		);
	}

	createPost (callback) {
		let postOptions = {
			token: this.token,
			streamId: this.stream._id,
			wantCodeBlocks: 1
		};
		this.postFactory.createRandomPost(callback, postOptions);
	}
}

module.exports = CommitHashRequiredTest;
