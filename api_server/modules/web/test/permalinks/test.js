// unit tests associated with creating permalinks within the web module

'use strict';

const PermalinkTest = require('./permalink_test');
const PrivatePermalinkLoginTest = require('./private_permalink_login_test');
const PrivatePermalinkTest = require('./private_permalink_test');
const ACLTest = require('./acl_test');
const CodemarkLinkNotFoundTest = require('./codemark_link_not_found_test');
const InvalidTeamTest = require('./invalid_team_test');
const ForgePublicPermalinkTest = require('./forge_public_permalink_test');
const ForgeAlreadyPublicPermalinkTest = require('./forge_already_public_permalink_test');
const IdentifyScriptTest = require('./identify_script_test');
const UrlButtonsTest = require('./url_buttons_test');
const WhitespaceReplaceTest = require('./whitespace_replace_test');
const TypedCodemarkPermalinkTest = require('./typed_codemark_permalink_test');

class PermlinksRequestTester {

	test () {

		new PermalinkTest().test();
		new PrivatePermalinkLoginTest().test();
		new PrivatePermalinkTest().test();
		new ACLTest().test();
		new CodemarkLinkNotFoundTest({ permalinkType: 'public' }).test();
		new CodemarkLinkNotFoundTest({ permalinkType: 'private' }).test();
		new InvalidTeamTest({ permalinkType: 'public' }).test();
		new InvalidTeamTest({ permalinkType: 'private', wantSignin: true }).test();
		new ForgePublicPermalinkTest().test();
		new ForgeAlreadyPublicPermalinkTest().test();
		new IdentifyScriptTest().test();
		new UrlButtonsTest().test();
		new WhitespaceReplaceTest().test();
		new TypedCodemarkPermalinkTest({ codemarkType: 'comment' }).test();
		new TypedCodemarkPermalinkTest({ codemarkType: 'issue' }).test();
		new TypedCodemarkPermalinkTest({ codemarkType: 'bookmark' }).test();
		new TypedCodemarkPermalinkTest({ codemarkType: 'question' }).test();
		new TypedCodemarkPermalinkTest({ codemarkType: 'trap' }).test();
	}
}

module.exports = new PermlinksRequestTester();