// handle unit tests for the items module

'use strict';

// make eslint happy
/* globals describe */

const GetItemRequestTester = require('./get_item/test');
const GetItemsRequestTester = require('./get_items/test');
const PostItemRequestTester = require('./post_item/test');
const PutItemRequestTester = require('./put_item/test');

describe('item requests', function() {

	this.timeout(20000);

	describe('GET /items/:id', GetItemRequestTester.test);
	describe('GET /items', GetItemsRequestTester.test);
	describe('POST /items', PostItemRequestTester.test);
	describe('PUT /items/:id', PutItemRequestTester.test);
});
