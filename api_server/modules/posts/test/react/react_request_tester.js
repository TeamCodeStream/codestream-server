// handle unit tests for the "PUT /posts" request

'use strict';

const ReactTest = require('./react_test');
const ClearReactTest = require('./clear_react_test');
const ReactFetchTest = require('./react_fetch_test');
const SecondReactFetchTest = require('./second_react_fetch_test');
const ThirdReactFetchTest = require('./third_react_fetch_test');
const ClearReactFetchTest = require('./clear_react_fetch_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const PostNotFoundTest = require('./post_not_found_test');
const TooManyReactionsTest = require('./too_many_reactions_test');
const IllegalCharacterTest = require('./illegal_character_test');
const NonBooleanTest = require('./non_boolean_test');
const EmptyReactionsTest = require('./empty_reactions_test');
const MessageTest = require('./message_test');

class ReactRequestTester {

	reactTest () {
		new ReactTest().test();
		new ClearReactTest().test();
		new ReactFetchTest().test();
		new SecondReactFetchTest().test();
		new ThirdReactFetchTest().test();
		new ClearReactFetchTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new PostNotFoundTest().test();
		new TooManyReactionsTest().test();
		new IllegalCharacterTest({ character: '$' }).test();
		new IllegalCharacterTest({ character: '.' }).test();
		new NonBooleanTest().test();
		new EmptyReactionsTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
	}
}

module.exports = ReactRequestTester;
