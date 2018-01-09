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
	}
}

/* jshint +W071 */

module.exports = EmailNotificationTester;
