// handle unit tests for the "POST /no-auth/provider-action/:provider" request,
// a callback for providers that provide action controls within posts
 
'use strict';

const ProviderActionTest = require('./provider_action_test');
const TrackingTest = require('./tracking_test');
//const PayloadRequiredTest = require('./payload_required_test');
const NoActionIdTest = require('./no_action_id_test');
const InvalidActionIdTest = require('./invalid_action_id_test');
const NoUserIdTest = require('./no_user_id_test');
const NoCodeStreamUserTest = require('./no_codestream_user_test');
const NoTeamIdTest = require('./no_team_id_test');
const UserNotOnTeamTest = require('./user_not_on_team_test');
const TeamNotFoundTest = require('./team_not_found_test');
const UnknownLinkTypeTest = require('./unknown_link_type_test');
//const InvalidSignatureTest = require('./invalid_signature_test');
//const ImproperSignatureTest = require('./improper_signature_test');

const PROVIDERS = [
	'slack'
];

class ProviderActionRequestTester {

	test () {
		PROVIDERS.forEach(provider => {
			new ProviderActionTest({ provider, linkType: 'web' }).test();
			new ProviderActionTest({ provider, linkType: 'ide' }).test();
			new ProviderActionTest({ provider, linkType: 'external', externalType: 'code' }).test();
			new ProviderActionTest({ provider, linkType: 'external', externalType: 'issue' }).test();
			new TrackingTest({ provider, linkType: 'web' }).test();
			new TrackingTest({ provider, linkType: 'ide' }).test();
			new TrackingTest({ provider, linkType: 'external', externalType: 'code' }).test();
			new TrackingTest({ provider, linkType: 'external', externalType: 'issue' }).test();
			//new PayloadRequiredTest({ provider }).test();
			new NoActionIdTest({ provider }).test();
			new InvalidActionIdTest({ provider }).test();
			new NoUserIdTest({ provider }).test();
			new NoCodeStreamUserTest({ provider }).test();
			new NoTeamIdTest({ provider }).test();
			new UserNotOnTeamTest({ provider }).test();
			new TeamNotFoundTest({ provider }).test();
			new UnknownLinkTypeTest({ provider }).test();
			//new InvalidSignatureTest({ provider }).test();
			//new ImproperSignatureTest({ provider }).test();
		});
	}
}

module.exports = new ProviderActionRequestTester();
