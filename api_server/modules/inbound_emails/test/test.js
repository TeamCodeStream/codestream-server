// unit tests associated with the inbound emails module

'use strict';

// make eslint happy
/* globals describe */

var InboundEmailTest = require('./inbound_email_test');
var InboundEmailMessageTest = require('./inbound_email_message_test');
var ACLTest = require('./acl_test');
var MissingParameterTest = require('./missing_parameter_test');
var IncorrectSecretTest = require('./incorrect_secret_test');
var NoFromAddressTest = require('./no_from_address_test');
var FromAddressNotFoundTest = require('./from_address_not_found_test');
var NoMatchReplyToDomainTest = require('./no_match_reply_to_domain_test');
var InvalidEmailTest = require('./invalid_email_test');
var InvalidFormatTest = require('./invalid_format_test');
var InvalidStreamIdTest = require('./invalid_stream_id_test');
var InvalidTeamIdTest = require('./invalid_team_id_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var StreamNoMatchTeamTest = require('./stream_no_match_team_test');
var OriginatorNotInTeamTest = require('./originator_not_in_team_test');
var TrackingTest = require('./tracking_test');
var NoTrackingTest = require('./no_tracking_test');

describe('inbound emails', function() {

	this.timeout(20000);

	new InboundEmailTest({ type: 'file' }).test();
	new InboundEmailTest({ type: 'channel' }).test();
	new InboundEmailTest({ type: 'direct' }).test();
	new InboundEmailMessageTest({ type: 'file' }).test();
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
	new TrackingTest({ type: 'file' }).test();
	new TrackingTest({ type: 'channel' }).test();
	new TrackingTest({ type: 'direct' }).test();
	new NoTrackingTest().test();
});
