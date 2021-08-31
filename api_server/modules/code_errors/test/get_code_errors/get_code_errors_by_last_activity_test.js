'use strict';

const GetCodeErrorsWithMarkersTest = require('./get_code_errors_with_markers_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class GetCodeErrorsByLastActivityTest extends GetCodeErrorsWithMarkersTest {

	get description () {
		return 'should return the correct code errors in correct order when requesting code errors for a team and by last activity';
	}


	setPath (callback) {
		// set path, and then reply to a couple of the code errors, which should boost their lastActivityAt
		// any of those posts
		BoundAsync.series(this, [
			super.setPath,
			this.replyToCodeErrors
		], callback);
	}

	replyToCodeErrors (callback) {
		const codeErrorsToReplyTo = [3, 8, 6, 2, 7, 4];
		this.path += '&byLastActivityAt=1';
		BoundAsync.forEachSeries(
			this,
			codeErrorsToReplyTo,
			this.replyToCodeError,
			callback
		);
	}

	replyToCodeError (nCodeError, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.expectedCodeErrors[nCodeError].postId,
					streamId: this.teamStream.id,
					text: RandomString.generate(50)
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedCodeErrors[nCodeError].lastActivityAt = response.codeErrors[0].$set.lastActivityAt;
				this.expectedCodeErrors.unshift(this.expectedCodeErrors[nCodeError]);
				this.expectedCodeErrors.splice(nCodeError + 1, 1);
				callback();
			}
		);
	}
}

module.exports = GetCodeErrorsByLastActivityTest;
