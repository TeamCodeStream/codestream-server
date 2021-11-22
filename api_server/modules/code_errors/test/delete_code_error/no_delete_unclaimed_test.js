'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NoDeleteUnclaimedTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when trying to delete a code error that has not been claimed by a team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the creator or a team admin can delete a code error'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			delete this.postOptions.creatorIndex;
			callback();
		});
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodeError,
			this.setExpectedData,
			this.setPath
		], callback);
	}

	createCodeError (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrCommentResponse = response;
				this.codeError = response.codeStreamResponse.codeError;
				this.post = response.codeStreamResponse.post;
				callback();
			}
		);
	}

	setExpectedData (callback) {
		// wait until we have claimed the code error
		if (!this.nrCommentResponse) { 
			return callback();
		} else {
			super.setExpectedData(callback);
		}
	}

	setPath (callback) {
		// wait until we have claimed the code error
		if (!this.nrCommentResponse) { 
			return callback();
		} else {
			super.setPath(callback);
		}
	}
}

module.exports = NoDeleteUnclaimedTest;
