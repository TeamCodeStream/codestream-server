// handle unit tests for the "PUT /posts" request

'use strict';

const PutPostTest = require('./put_post_test');
const PutPostFetchTest = require('./put_post_fetch_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const PostNotFoundTest = require('./post_not_found_test');
const MessageTest = require('./message_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const MentionTest = require('./mention_test');
const SharedToTest = require('./shared_to_test');
const UpdateReplyToCodeErrorTest = require('./update_reply_to_code_error_test');
const RemovedMemberCantUpdateTest = require('./removed_member_cant_update_test');

class PutPostRequestTester {

	putPostTest () {
		new PutPostTest().test();
		new PutPostFetchTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new PostNotFoundTest().test();
		new MessageTest().test();
		// NOTE - posting to streams other than the team stream is no longer allowed
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'team stream' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'repoId' }).test();
		new MentionTest().test();
		new SharedToTest().test();
		new UpdateReplyToCodeErrorTest().test();
		new RemovedMemberCantUpdateTest().test();
	}
}

module.exports = PutPostRequestTester;
