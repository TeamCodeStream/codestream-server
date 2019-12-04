'use strict';

const TrackingTest = require('./tracking_test');
const Assert = require('assert');

class TrackingWithCodemarkTest extends TrackingTest {

	get description () {
		const privacy = this.makePublic ? 'public ' : '';
		return `should send a Replied to Codemark event for tracking purposes when handling a reply to codemark via email for a ${privacy}${this.type} stream`;
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

	validateMessage (message) {
		if (message.message.type !== 'track') {
			return false;
		}
		this.forReplyToCodemark = true;
		Assert.equal(message.message.data.properties['Codemark ID'], this.postData[0].codemark.id, 'Codemark ID not correct in tracking data');
		return super.validateMessage(message);
	}
}

module.exports = TrackingWithCodemarkTest;
