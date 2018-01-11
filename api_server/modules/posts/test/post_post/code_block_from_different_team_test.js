'use strict';

var PostPostTest = require('./post_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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
		// file streams must have repoId
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;
			callback();
		});
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		// before forming the post data, we'll create a second repo and file-type
		// stream, we'll use this for the code block
		BoundAsync.series(this, [
			this.createOtherRepo,
			this.createOtherFileStream,
			this.setPostData,
			super.makePostData
		], callback);
	}

	// create a second repo
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

	// create a second file-type stream in the other repo
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

	// set the data to use for creating the post
	setPostData (callback) {
		// in our post options, try to use a code block from the other file
		// stream, since the other file stream is from a different team, this
		// should not be allowed
		Object.assign(this.postOptions, {
			wantCodeBlocks: 1,
			codeBlockStreamId: this.otherFileStream._id
		});
		callback();
	}
}

module.exports = CodeBlockFromDifferentTeamTest;
