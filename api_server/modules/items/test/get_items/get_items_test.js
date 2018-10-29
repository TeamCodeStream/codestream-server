'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ItemTestConstants = require('../item_test_constants');
const Assert = require('assert');

class GetItemsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 10,
			creatorIndex: 1,
			wantItem: true,
			itemTypes: ['question', 'issue', 'codetrap'],
			assignedTypes: [0, 1, 2, 1, 2, 0, 2, 1, 1, 0]
		});
	}

	get description () {
		return 'should return the correct items when requesting items for a team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path to use for the request
		], callback);
	}

	// get the query parameters to use for the request
	getQueryParameters () {
		return {
			teamId: this.team._id
		};
	}

	// set the path to use for the request
	setPath (callback) {
		this.items = this.postData.map(postData => postData.items[0]);
		const queryParameters = this.getQueryParameters();
		this.path = '/items?' + Object.keys(queryParameters).map(parameter => {
			const value = queryParameters[parameter];
			return `${parameter}=${value}`;
		}).join('&');
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct items, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.items, this.items, 'items');
		this.validateSanitizedObjects(data.items, ItemTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure we got a post with each item that matches the post to which the item belongs
		data.items.forEach(item => {
			if (item.post) {
				Assert.equal(item.post._id, item.postId, 'ID of child post to item does not match the item\'s postId');
			}
			else {
				Assert(item.providerType, 'no post for a non-third-party item');
			}
		});
	}
}

module.exports = GetItemsTest;
