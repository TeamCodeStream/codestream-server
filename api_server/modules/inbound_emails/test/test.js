// unit tests associated with the inbound emails module

'use strict';

// make eslint happy
/* globals describe */

const InboundEmailTest = require('./inbound_email_test');
const InboundEmailMessageTest = require('./inbound_email_message_test');
const ACLTest = require('./acl_test');
const MissingParameterTest = require('./missing_parameter_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const NoFromAddressTest = require('./no_from_address_test');
const FromAddressNotFoundTest = require('./from_address_not_found_test');
const NoMatchReplyToDomainTest = require('./no_match_reply_to_domain_test');
const InvalidEmailTest = require('./invalid_email_test');
const InvalidFormatTest = require('./invalid_format_test');
const InvalidStreamIdTest = require('./invalid_stream_id_test');
const InvalidTeamIdTest = require('./invalid_team_id_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
const OriginatorNotInTeamTest = require('./originator_not_in_team_test');
const TrackingTest = require('./tracking_test');
//const NoTrackingTest = require('./no_tracking_test');

describe('inbound emails', function() {

	this.timeout(20000);

	//new InboundEmailTest({ type: 'file' }).test();
	new InboundEmailTest({ type: 'channel' }).test();
	new InboundEmailTest({ type: 'direct' }).test();
	//new InboundEmailMessageTest({ type: 'file' }).test();
	new InboundEmailMessageTest({ type: 'channel' }).test();
	new InboundEmailMessageTest({ type: 'direct' }).test();
	new InboundEmailMessageTest({ type: 'channel', isTeamStream: true }).test();
	new ACLTest().test();
	new MissingParameterTest({ parameter: 'to' }).test();
	new MissingParameterTest({ parameter: 'from' }).test();
	new MissingParameterTest({ parameter: 'text' }).test();
	new MissingParameterTest({ parameter: 'mailFile' }).test();
	new IncorrectSecretTest().test();
	new NoFromAddressTest().test();
	new FromAddressNotFoundTest().test();
	new NoMatchReplyToDomainTest().test();
	new InvalidEmailTest().test();
	new InvalidFormatTest().test();
	new InvalidStreamIdTest().test();
	new InvalidTeamIdTest().test();
	new StreamNotFoundTest().test();
	new StreamNoMatchTeamTest().test();
	new OriginatorNotInTeamTest().test();
	//new TrackingTest({ type: 'file' }).test();
	new TrackingTest({ type: 'channel' }).test();
	new TrackingTest({ type: 'channel', makePublic: true }).test();
	new TrackingTest({ type: 'direct' }).test();
	//new NoTrackingTest().test(); // DONT KNOW WHY THIS ISNT WORKING ... INVESTIGATE
});
