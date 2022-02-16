// unit tests associated with the web module

'use strict';

// make eslint happy
/* globals describe */

const SimpleWebTest = require('./simple_web_test');
const PermalinkTest = require('./permalink_test');
const PrivatePermalinkLoginTest = require('./private_permalink_login_test');
const PrivatePermalinkTest = require('./private_permalink_test');
const ACLTest = require('./acl_test');
const CodemarkLinkNotFoundTest = require('./codemark_link_not_found_test');
const InvalidTeamTest = require('./invalid_team_test');
const ForgePublicPermalinkTest = require('./forge_public_permalink_test');
const ForgeAlreadyPublicPermalinkTest = require('./forge_already_public_permalink_test');
const IdentifyScriptTest = require('./identify_script_test');
//const UrlButtonsTest = require('./url_buttons_test');
const WhitespaceReplaceTest = require('./whitespace_replace_test');
//const TypedCodemarkPermalinkTest = require('./typed_codemark_permalink_test');

const SIMPLE_TESTS = [
	{
		route: '/web/404',
		text: 'Sorry, we couldn\'t find what you were looking for.'
	},
	{
		route: '/web/finish',
		text: 'Return to your IDE to start using CodeStream.'
	},
	{
		route: '/web/user/password/reset/invalid',
		text: 'Return to your IDE and click on "Forgot password?" to request a new one.'
	},
	{
		route: '/web/user/password/updated',
		text: 'Return to your IDE'
	}
];

describe('web', function() {

	this.timeout(5000);

	SIMPLE_TESTS.forEach(test => {
		new SimpleWebTest(test).test();
	});
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
	//new UrlButtonsTest().test();
	new WhitespaceReplaceTest().test();

	describe('launcher tests', require('./launcher_test'));
	/*
	new TypedCodemarkPermalinkTest({ codemarkType: 'comment' }).test();
	new TypedCodemarkPermalinkTest({ codemarkType: 'issue' }).test();
	new TypedCodemarkPermalinkTest({ codemarkType: 'bookmark' }).test();
	new TypedCodemarkPermalinkTest({ codemarkType: 'question' }).test();
	new TypedCodemarkPermalinkTest({ codemarkType: 'trap' }).test();
	*/
});
