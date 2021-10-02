'use strict';

const PostReplyTest = require('../post_reply_test');

class CodeErrorReplyTest extends PostReplyTest {

	get description () {
		return 'should be ok to reply to a code error';
	}

	getExpectedFields () {
		const expectedFields = [...(super.getExpectedFields().post)];
		const idx = expectedFields.findIndex(field => field === 'teamId'); 
		expectedFields.splice(idx, 1);
		return { post: expectedFields };
	}

	setTestOptions (callback) {
		this.noExpectedTeamId = true;
		this.expectedStreamVersion = 2;
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodeError: true
			});
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.postData[0].codeError.streamId;
			this.expectedStreamId = this.postData[0].codeError.streamId;
			callback();
		});
	}
}

module.exports = CodeErrorReplyTest;
