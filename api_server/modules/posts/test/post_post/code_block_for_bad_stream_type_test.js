'use strict';

const CodeBlockTest = require('./code_block_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CodeBlockForBadStreamTypeTest extends CodeBlockTest {

	get description () {
		return `should return an error when attempting to create a post with a code block element where the stream is of type ${this.streamType}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'only file type streams can have code blocks'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherStream
		], callback);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) return callback(error);
				this.data.codeBlocks[0].streamId = response.stream._id;
				callback();
			},
			{
				teamId: this.team._id,
				type: this.streamType,
				token: this.token
			}
		);
	}
}

module.exports = CodeBlockForBadStreamTypeTest;
