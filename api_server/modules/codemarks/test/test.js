// handle unit tests for the codemarks module

'use strict';

// make eslint happy
/* globals describe */

const GetCodemarkRequestTester = require('./get_codemark/test');
const GetCodemarksRequestTester = require('./get_codemarks/test');
const PostCodemarkRequestTester = require('./post_codemark/test');
const PutCodemarkRequestTester = require('./put_codemark/test');
const DeleteCodemarkRequestTester = require('./delete_codemark/test');
const PinRequestTester = require('./pin/test');
const UnpinRequestTester = require('./unpin/test');
const PinPostRequestTester = require('./pin_post/test');
const UnpinPostRequestTester = require('./unpin_post/test');
const CodemarkLinkRequestTester = require('./codemark_link/test');
const RelateCodemarkRequestTester = require('./relate_codemark/test');
const UnrelateCodemarkRequestTester = require('./unrelate_codemark/test');
const AddTagRequestTester = require('./add_tag/test');
const RemoveTagRequestTester = require('./remove_tag/test');
const FollowRequestTester = require('./follow/test');
const UnfollowRequestTester = require('./unfollow/test');
const UnfollowLinkRequestTester = require('./unfollow_link/test');
const AddMarkersRequestTester = require('./add_markers/test');

describe('codemark requests', function() {

	this.timeout(20000);

	describe('GET /codemarks/:id', GetCodemarkRequestTester.test);
	describe('GET /codemarks', GetCodemarksRequestTester.test);
	describe('POST /codemarks', PostCodemarkRequestTester.test);
	describe('PUT /codemarks/:id', PutCodemarkRequestTester.test);
	describe('DELETE /codemarks/:id', DeleteCodemarkRequestTester.test);
	describe('PUT /pin/:id', PinRequestTester.test);
	describe('PUT /unpin/:id', UnpinRequestTester.test);
	describe('PUT /pin-post', PinPostRequestTester.test);
	describe('PUT /unpin-post', UnpinPostRequestTester.test);
	describe('POST /codemark/:id/permalink', CodemarkLinkRequestTester.test);
	describe('PUT /relate-codemark/:id1/:id2', RelateCodemarkRequestTester.test);
	describe('PUT /unrelate-codemark/:id1/:id2', UnrelateCodemarkRequestTester.test);
	describe('PUT /codemarks/:id/add-tag', AddTagRequestTester.test);
	describe('PUT /codemarks/:id/remove-tag', RemoveTagRequestTester.test);
	describe('PUT /codemarks/follow/:id', FollowRequestTester.test);
	describe('PUT /codemarks/unfollow/:id', UnfollowRequestTester.test);
	describe('GET /no-auth/unfollow-link/:id', UnfollowLinkRequestTester.test);
	describe('PUT /codemarks/:id/add-markers', AddMarkersRequestTester.test);
});
