// handle unit tests for email notifications

'use strict';

var UnregisteredFirstEmailTest = require('./unregistered_first_email_test');
var UnregisteredOngoingEmailTest = require('./unregistered_ongoing_email_test');
var RegisteredFirstEmailTest = require('./registered_first_email_test');
var RegisteredOngoingEmailTest = require('./registered_ongoing_email_test');
var MentionFirstEmailTest = require('./mention_first_email_test');
var MentionOngoingEmailTest = require('./mention_ongoing_email_test');
var MentionUnregisteredFirstEmailTest = require('./mention_unregistered_first_email_test');
var MentionUnregisteredOngoingEmailTest = require('./mention_unregistered_ongoing_email_test');
var OfflineForRepoTest = require('./offline_for_repo_test');
var CodeBlockTest = require('./code_block_test');
var MultiLineTest = require('./multi_line_test');
var OnlineNoEmailTest = require('./online_no_email_test');
var CreatorNoEmailTest = require('./creator_no_email_test');
var ReplyTest = require('./reply_test');
var PreferOffNoEmailTest = require('./prefer_off_no_email_test');
var PreferMentionsNoEmailTest = require('./prefer_mentions_no_email_test');
var PreferOffForFileNoEmailTest = require('./prefer_off_for_file_no_email_test');
var PreferOffForDirectoryNoEmailTest = require('./prefer_off_for_directory_no_email_test');
var PreferOffForParentDirectoryNoEmailTest = require('./prefer_off_for_parent_directory_no_email_test');
var PreferOffForRepoNoEmailTest = require('./prefer_off_for_repo_no_email_test');
var PreferOnTest = require('./prefer_on_test');
var PreferMentionsTest = require('./prefer_mentions_test');

/* jshint -W071 */

class EmailNotificationTester {

	emailNotificationTest () {
		new UnregisteredFirstEmailTest().test();
		new UnregisteredOngoingEmailTest().test();
		new RegisteredFirstEmailTest().test();
		new RegisteredOngoingEmailTest().test();
		new MentionFirstEmailTest().test();
		new MentionOngoingEmailTest().test();
		new MentionUnregisteredFirstEmailTest().test();
		new MentionUnregisteredOngoingEmailTest().test();
		new OfflineForRepoTest().test();
		new CodeBlockTest().test();
		new MultiLineTest().test();
		new OnlineNoEmailTest().test();
		new CreatorNoEmailTest().test();
		new ReplyTest().test();
		new PreferOffNoEmailTest().test();
		new PreferMentionsNoEmailTest().test();
		new PreferOffForFileNoEmailTest().test();
		new PreferOffForDirectoryNoEmailTest().test();
		new PreferOffForParentDirectoryNoEmailTest().test();
		new PreferOffForRepoNoEmailTest().test();
		new PreferOnTest().test();
		new PreferMentionsTest().test();
	}
}

/* jshint +W071 */

module.exports = EmailNotificationTester;
