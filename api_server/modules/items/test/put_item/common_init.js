// base class for many tests of the "PUT /items" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessItem,
			this.makeItemData
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	makePostlessItem (callback) {
		const itemData = this.itemFactory.getRandomItemData();
		Object.assign(itemData, {
			teamId: this.team._id,
			providerType: 'slack'
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/items',
				data: itemData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.item = response.item;
				callback();
			}
		);
	}

	// form the data for the item update
	makeItemData (callback) {
		this.data = {
			postId: RandomString.generate(10),
			streamId: RandomString.generate(10)
		};
		this.expectedData = {
			item: {
				_id: this.item._id,
				$set: Object.assign(DeepClone(this.data), { 
					version: this.expectedVersion,
					providerType: this.item.providerType,
					modifiedAt: Date.now()	// placeholder
				}),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedItem = DeepClone(this.item);
		Object.assign(this.expectedItem, this.expectedData.item.$set);
		this.modifiedAfter = Date.now();
		this.path = '/items/' + this.item._id;
		callback();
	}
}

module.exports = CommonInit;
