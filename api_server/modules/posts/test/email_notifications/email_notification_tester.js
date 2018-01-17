// handle unit tests for email notifications

'use strict';

var UnregisteredFirstEmailTest = require('./unregistered_first_email_test');
var UnregisteredOngoingEmailTest = require('./unregistered_ongoing_email_test');
var RegisteredFirstEmailTest = require('./registered_first_email_test');
var RegisteredOngoingEmailTest = require('./registered_ongoing_email_test');
var MentionFirstEmailTest = require('./mention_first_email_test');
var MentionOngoingEmailTest = require('./mention_ongoing_email_test');
var OfflineForRepoTest = require('./offline_for_repo_test');
var CodeBlockTest = require('./code_block_test');
var OnlineNoEmailTest = require('./online_no_email_test');
var CreatorNoEmailTest = require('./creator_no_email_test');
var ReplyTest = require('./reply_test');
var PreferOffNoEmailTest = require('./prefer_off_no_email_test');
var PreferMentionsNoEmailTest = require('./prefer_mentions_no_email_test');
var PreferOffForStreamNoEmailTest = require('./prefer_off_for_stream_no_email_test');
var PreferDefaultOffNoEmailTest = require('./prefer_default_off_no_email_test');
var PreferDefaultMentionsNoEmailTest = require('./prefer_default_mentions_no_email_test');
var PreferStreamMentionsNoEmailTest = require('./prefer_stream_mentions_no_email_test');
var PreferenceOnTest = require('./preference_on_test');
var PreferMentionsTest = require('./prefer_mentions_test');
var PreferDefaultMentionsTest = require('./prefer_default_mentions_test');
var PreferDefaultOnTest = require('./prefer_default_on_test');
var PreferOnForStreamTest = require('./prefer_on_for_stream_test');
var PreferStreamMentionsTest = require('./prefer_stream_mentions_test');

/* jshint -W071 */

class EmailNotificationTester {

	emailNotificationTest () {
		new UnregisteredFirstEmailTest().test();
		new UnregisteredOngoingEmailTest().test();
		new RegisteredFirstEmailTest().test();
		new RegisteredOngoingEmailTest().test();
		new MentionFirstEmailTest().test();
		new MentionOngoingEmailTest().test();
		new OfflineForRepoTest().test();
		new CodeBlockTest().test();
		new OnlineNoEmailTest().test();
		new CreatorNoEmailTest().test();
		new ReplyTest().test();
		new PreferOffNoEmailTest().test();
		new PreferMentionsNoEmailTest().test();
		new PreferOffForStreamNoEmailTest().test();
		new PreferDefaultOffNoEmailTest().test();
		new PreferDefaultMentionsNoEmailTest().test();
		new PreferStreamMentionsNoEmailTest().test();
		new PreferenceOnTest().test();
		new PreferMentionsTest().test();
		new PreferDefaultMentionsTest().test();
		new PreferDefaultOnTest().test();
		new PreferOnForStreamTest().test();
		new PreferStreamMentionsTest().test();
	}
}

/* jshint +W071 */

module.exports = EmailNotificationTester;
