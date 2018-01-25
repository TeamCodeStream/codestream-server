// handle unit tests for the "PUT /posts" request

'use strict';

var PutPostTest = require('./put_post_test');
var ACLTest = require('./acl_test');
var ACLTeamTest = require('./acl_team_test');
var PostNotFoundTest = require('./post_not_found_test');
var MessageToTeamTest = require('./message_to_team_test');
var MessageToStreamTest = require('./message_to_stream_test');
var NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
var MentionTest = require('./mention_test');

/* jshint -W071 */

class PutPostRequestTester {

	putPostTest () {
		new PutPostTest().test();
        new ACLTest().test();
        new ACLTeamTest().test();
        new PostNotFoundTest().test();
        new MessageToTeamTest().test();
		new MessageToStreamTest({ streamType: 'channel' }).test();
		new MessageToStreamTest({ streamType: 'direct' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'repoId' }).test();
		new MentionTest().test();
	}
}

/* jshint +W071 */

module.exports = PutPostRequestTester;
