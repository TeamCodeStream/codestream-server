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
const TrackingReplyToReviewTest = require('./tracking_reply_to_review_test');
const TrackingCodemarkReplyToReviewTest = require('./tracking_codemark_reply_to_review_test');
const TrackingReplyToReviewReplyTest = require('./tracking_reply_to_review_reply_test');
const NoTrackingTest = require('./no_tracking_test');
const CodemarkReplyTest = require('./codemark_reply_test');
const CodemarkReplyMessageTest = require('./codemark_reply_message_test');
const InvalidCodemarkIdTest = require('./invalid_codemark_id_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const CodemarkNoMatchTeamTest = require('./codemark_no_match_team_test');
const CodemarkNoMatchStreamTest = require('./codemark_no_match_stream_test');
const ReviewReplyTest = require('./review_reply_test');
const ReviewReplyMessageTest = require('./review_reply_message_test');
const InvalidReviewIdTest = require('./invalid_review_id_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const ReviewNoMatchTeamTest = require('./review_no_match_team_test');
const ReviewNoMatchStreamTest = require('./review_no_match_stream_test');

describe('inbound emails', function() {

	this.timeout(20000);

	new InboundEmailTest({ type: 'channel' }).test();
	new InboundEmailTest({ type: 'direct' }).test();
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
	new TrackingTest({ type: 'channel', makePublic: true }).test();
	new TrackingReplyToReviewTest({ type: 'channel', makePublic: true }).test();
	new TrackingCodemarkReplyToReviewTest({ type: 'channel', makePublic: true }).test();
	new TrackingReplyToReviewReplyTest({ type: 'channel', makePublic: true }).test();
	new NoTrackingTest().test(); 
	new CodemarkReplyTest({ type: 'channel' }).test();
	new CodemarkReplyTest({ type: 'direct' }).test();
	new CodemarkReplyTest({ type: 'channel', isTeamStream: true }).test();
	new CodemarkReplyMessageTest({ type: 'channel' }).test();
	new CodemarkReplyMessageTest({ type: 'direct' }).test();
	new CodemarkReplyMessageTest({ type: 'channel', isTeamStream: true }).test();
	new InvalidCodemarkIdTest().test();
	new CodemarkNotFoundTest().test();
	new CodemarkNoMatchTeamTest().test();
	new CodemarkNoMatchStreamTest().test();
	new ReviewReplyTest({ type: 'channel' }).test();
	new ReviewReplyTest({ type: 'direct' }).test();
	new ReviewReplyTest({ type: 'channel', isTeamStream: true }).test();
	new ReviewReplyMessageTest({ type: 'channel' }).test();
	new ReviewReplyMessageTest({ type: 'direct' }).test();
	new ReviewReplyMessageTest({ type: 'channel', isTeamStream: true }).test();
	new InvalidReviewIdTest().test();
	new ReviewNotFoundTest().test();
	new ReviewNoMatchTeamTest().test();
	new ReviewNoMatchStreamTest().test();
});
