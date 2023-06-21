// unit tests associated with the web module

'use strict';

// make eslint happy
/* globals describe */

const SimpleWebTest = require('./simple_web_test');
const PermalinkTest = require('./permalink_test');
const PrivatePermalinkNoAuthTest = require('./private_permalink_noauth_test');
const CodemarkLinkNotFoundTest = require('./codemark_link_not_found_test');
const InvalidTeamTest = require('./invalid_team_test');
//const UrlButtonsTest = require('./url_buttons_test');
//const TypedCodemarkPermalinkTest = require('./typed_codemark_permalink_test');
const ConfirmEmailRequestTester = require('./confirm_email/test');
const WebSetPasswordRequestTester = require('./web_set_password/test');
const SetPasswordRequestTester = require('./set_password/test');

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

	this.timeout(10000);

	SIMPLE_TESTS.forEach(test => {
		new SimpleWebTest(test).test();
	});
	new PermalinkTest().test();
	new PrivatePermalinkNoAuthTest().test();
	new CodemarkLinkNotFoundTest({ permalinkType: 'public' }).test();
	new CodemarkLinkNotFoundTest({ permalinkType: 'private' }).test();
	new InvalidTeamTest({ permalinkType: 'public' }).test();
	new InvalidTeamTest({ permalinkType: 'private', wantSignin: true }).test();
	//new UrlButtonsTest().test();

	describe('launcher tests', require('./launcher_test'));

	//new TypedCodemarkPermalinkTest({ codemarkType: 'comment' }).test();
	//new TypedCodemarkPermalinkTest({ codemarkType: 'issue' }).test();
	//new TypedCodemarkPermalinkTest({ codemarkType: 'bookmark' }).test();
	//new TypedCodemarkPermalinkTest({ codemarkType: 'question' }).test();
	//new TypedCodemarkPermalinkTest({ codemarkType: 'trap' }).test();

	describe('GET /web/confirm-email', ConfirmEmailRequestTester.test);
	describe('GET /web/user/password', WebSetPasswordRequestTester.test);
	describe('POST /web/user/password', SetPasswordRequestTester.test);
});
