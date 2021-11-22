'use strict';

const TrackingReplyToCodeErrorTest = require('./tracking_reply_to_code_error_test');

class TrackingCodemarkReplyToCodeErrorTest extends TrackingReplyToCodeErrorTest {

	get description () {
		return 'should send a Reply Created event for tracking purposes when handling a reply to a codemark reply to a code error via email';
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			const codemarkData = this.codemarkFactory.getRandomCodemarkData({ wantMarkers: 1 });
			this.doApiRequest(
				{
					method: 'post',
					path: '/posts',
					data: {
						streamId: this.postData[0].post.streamId,
						parentPostId: this.postData[0].post.id,
						codemark: codemarkData
					},
					token: this.users[0].accessToken
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.expectedParentId = response.codemark.id;
					this.expectedParentType = 'Error.Codemark';
					const emailParts = this.data.to[0].address.split('@');
					const leftParts = emailParts[0].split('.');
					this.data.to[0].address = `${response.post.id}.${leftParts[1]}.${leftParts[2]}@${emailParts[1]}`;
					callback();
				}
			);
		});
	}
}

module.exports = TrackingCodemarkReplyToCodeErrorTest;
