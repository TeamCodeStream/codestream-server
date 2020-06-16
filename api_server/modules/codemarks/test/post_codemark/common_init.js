// base class for many tests of the "POST /codemarks" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCodemarkData		// make the data associated with the test codemark to be created
		], callback);
	}
	
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the codemark we'll create in the test
	makeCodemarkData (callback) {
		this.codemarkCreatedAfter = Date.now();
		this.data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		Object.assign(this.data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		if (this.codemarkType === 'link') {
			delete this.data.title;
			delete this.data.text;
		}
		callback();
	}
}

module.exports = CommonInit;
