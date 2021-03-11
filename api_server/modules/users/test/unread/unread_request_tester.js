// handle unit tests for the "PUT /unread/:postId" request, to mark a post (and all subsequent posts) 
// as unread in a particular stream

'use strict';

const UnreadTest = require('./unread_test');
const UnreadFetchTest = require('./unread_fetch_test');
//const UnreadACLTest = require('./unread_acl_test');
const PostNotFoundTest = require('./post_not_found_test');
const UnreadMessageTest = require('./unread_message_test');

class UnreadRequestTester {

	unreadTest () {
		new UnreadTest().test();
		new UnreadFetchTest().test();
		//new UnreadACLTest().test();
		new PostNotFoundTest().test();
		new UnreadMessageTest().test();
	}
}

module.exports = UnreadRequestTester;
