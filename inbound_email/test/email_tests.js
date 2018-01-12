'use strict';

// define a series of test parameters to be used for unit testing the inbound email server
module.exports = [
/*
	{
		description: 'a simple email',
		emailFile: 'simple.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with no from address',
		emailFile: 'no_from.eml',
		shouldFail: true
	},
	{
		description: 'an email with no to address',
		emailFile: 'no_to.eml',
		shouldFail: true
	},
	{
		description: 'an email with only a matching to address (no other candidate to addresses)',
		emailFile: 'only_to.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching cc address (no other candidate to addresses)',
		emailFile: 'only_cc.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching bcc address (no other candidate to addresses)',
		emailFile: 'only_bcc.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching x-original-to address (no other candidate to addresses)',
		emailFile: 'only_x_original_to.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching delivered-to address (no other candidate to addresses)',
		emailFile: 'only_delivered_to.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with no CodeStream address',
		emailFile: 'no_codestream_address.eml',
		shouldFail: true
	},
	{
		description: 'an email with no text content, only html',
		emailFile: 'only_html.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with various html',
		emailFile: 'html.eml',
		expectedText: 'paragraph\n\ndiv\n\n\n   between spaces   past spaces'
	},
	{
		description: 'an email with a "From:" reply',
		emailFile: 'with_from_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with a "wrote:" reply',
		emailFile: 'with_wrote_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with a "via" reply',
		emailFile: 'with_via_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with a "sender" reply',
		emailFile: 'with_sender_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with a "sender wrote" reply',
		emailFile: 'with_sender_wrote_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with an "on wrote" reply',
		emailFile: 'with_on_wrote_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with an "original message" reply',
		emailFile: 'with_original_message_reply.eml',
		expectedText: 'test'
	},
	{
		description: 'an email with a signature',
		emailFile: 'with_signature.eml',
		expectedText: 'test'
	},
*/
	{
		description: 'an email with no text',
		emailFile: 'no_text.eml',
		shouldFail: true
	}
];
