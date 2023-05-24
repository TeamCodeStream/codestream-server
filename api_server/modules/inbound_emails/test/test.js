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
const TrackingReplyToCodeErrorTest = require('./tracking_reply_to_code_error_test');
const TrackingCodemarkReplyToReviewTest = require('./tracking_codemark_reply_to_review_test');
const TrackingCodemarkReplyToCodeErrorTest = require('./tracking_codemark_reply_to_code_error_test');
const TrackingReplyToReviewReplyTest = require('./tracking_reply_to_review_reply_test');
const TrackingReplyToCodeErrorReplyTest = require('./tracking_reply_to_code_error_reply_test');
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
const CodeErrorReplyTest = require('./code_error_reply_test');
const CodeErrorReplyMessageTest = require('./code_error_reply_message_test');
const InvalidCodeErrorIdTest = require('./invalid_code_error_id_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const CodeErrorNoMatchTeamTest = require('./code_error_no_match_team_test');
const FindCorrectFromUserTest = require('./find_correct_from_user_test');

describe('inbound emails', function() {

	this.timeout(20000);

	new InboundEmailTest().test();
	new InboundEmailMessageTest().test();
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
	new TrackingTest().test();
	new TrackingTest({ unifiedIdentityEnabled: true }).test();
	new TrackingReplyToReviewTest().test();
	new TrackingReplyToCodeErrorTest().test();
	new TrackingCodemarkReplyToReviewTest().test();
	new TrackingCodemarkReplyToCodeErrorTest().test();
	new TrackingReplyToReviewReplyTest().test();
	new TrackingReplyToCodeErrorReplyTest().test();
	new NoTrackingTest().test(); 
	new CodemarkReplyTest().test();
	new CodemarkReplyMessageTest().test();
	new InvalidCodemarkIdTest().test();
	new CodemarkNotFoundTest().test();
	new CodemarkNoMatchTeamTest().test();
	//new CodemarkNoMatchStreamTest().test();
	new ReviewReplyTest().test();
	new ReviewReplyMessageTest().test();
	new InvalidReviewIdTest().test();
	new ReviewNotFoundTest().test();
	new ReviewNoMatchTeamTest().test();
	//new ReviewNoMatchStreamTest().test();
	new CodeErrorReplyTest().test();
	new CodeErrorReplyMessageTest().test();
	new InvalidCodeErrorIdTest().test();
	new CodeErrorNotFoundTest().test();
	new CodeErrorNoMatchTeamTest().test();
	new FindCorrectFromUserTest().test();
});
