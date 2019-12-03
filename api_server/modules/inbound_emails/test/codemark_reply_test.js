'use strict';

const InboundEmailTest = require('./inbound_email_test');
const Assert = require('assert');

class CodemarkReplyTest extends InboundEmailTest {

	get description () {
		const type = this.isTeamStream ? 'team' : this.type;
		return `should create and return a post as a reply to the codemark when an inbound email call is made for a codemark created in a ${type} stream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodemark: true,
				wantMarkers: true
			});
			callback();
		});
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.to[0].address = `${this.postData[0].codemark.id}.${this.data.to[0].address}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.post.parentPostId, this.postData[0].post.id, 'returned post does not have the proper post as a parent');
		super.validateResponse(data);
	}
}

module.exports = CodemarkReplyTest;
