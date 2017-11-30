'use strict';

var PostPostTest = require('./post_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class CodeBlockFromDifferentTeamTest extends PostPostTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the stream is from a different team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;
			callback();
		});
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			this.createOtherRepo,
			this.createOtherFileStream,
			this.setPostData,
			super.makePostData
		], callback);
	}

	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	createOtherFileStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherFileStream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.otherRepo.teamId,
				repoId: this.otherRepo._id,
				token: this.token
			}
		);
	}

	setPostData (callback) {
		Object.assign(this.postOptions, {
			wantCodeBlocks: 1,
			codeBlockStreamId: this.otherFileStream._id
		});
		callback();
	}
}

module.exports = CodeBlockFromDifferentTeamTest;
