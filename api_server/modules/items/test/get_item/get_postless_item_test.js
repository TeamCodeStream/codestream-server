'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ItemTestConstants = require('../item_test_constants');
const RandomString = require('randomstring');
const Assert = require('assert');

class GetPostlessItemTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the item when requesting a postless item created for a third-party provider';
	}

	getExpectedFields () {
		return { item: ItemTestConstants.EXPECTED_ITEM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createItem
		], callback);
	}

	// create the item to fetch
	createItem (callback) {
		const data = this.makeItemData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/items',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.item = response.item;
				this.path = '/items/' + this.item._id;
				callback();
			}
		);
	}

	// make the data for the item to be created for the test
	makeItemData () {
		const data = this.itemFactory.getRandomItemData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: 'slack',
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct item, and that we only got sanitized attributes
		this.validateMatchingObject(this.item._id, data.item, 'item');
		Assert.equal(data.post, undefined, 'post is not undefined');
		this.validateSanitized(data.item, ItemTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostlessItemTest;
