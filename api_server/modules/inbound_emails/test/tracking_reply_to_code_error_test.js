'use strict';

const TrackingTest = require('./tracking_test');

class TrackingReplyToCodeErrorTest extends TrackingTest {

	get description () {
		return 'should send a Reply Created event for tracking purposes when handling a reply to a code error via email';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodeError: true,
				wantCodemark: undefined
			});
			callback();
		});
	}

	makePostData (callback) {
		this.useStream = this.postData[0].streams[0];
		super.makePostData(callback);
	}

	validateMessage (message) {
		if (message.message.type !== 'track') {
			return false;
		}
		this.expectedParentId = this.expectedParentId || this.postData[0].codeError.id;
		this.expectedParentType = this.expectedParentType || 'Error';
		return super.validateMessage(message);
	}
}

module.exports = TrackingReplyToCodeErrorTest;
