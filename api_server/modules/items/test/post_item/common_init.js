// base class for many tests of the "POST /items" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeItemData		// make the data associated with the test item to be created
		], callback);
	}
	
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the item we'll create in the test
	makeItemData (callback) {
		this.itemCreatedAfter = Date.now();
		this.itemFactory.getRandomItemData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = Object.assign(data, {
					teamId: this.team._id,
					providerType: 'slack',
					streamId: RandomString.generate(10),
					postId: RandomString.generate(10)
				});
				callback();
			}
		);
	}
}

module.exports = CommonInit;
