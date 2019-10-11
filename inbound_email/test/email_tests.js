'use strict';

// define a series of test parameters to be used for unit testing the inbound email server
module.exports = [
	{
		description: 'a simple email',
		emailFile: 'simple',
		expectedText: 'test'
	},
	{
		description: 'an email with no from address',
		emailFile: 'no_from',
		shouldFail: true
	},
	{
		description: 'an email with no to address',
		emailFile: 'no_to',
		shouldFail: true
	},
	{
		description: 'an email with only a matching to address (no other candidate to addresses)',
		emailFile: 'only_to',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching cc address (no other candidate to addresses)',
		emailFile: 'only_cc',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching bcc address (no other candidate to addresses)',
		emailFile: 'only_bcc',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching x-original-to address (no other candidate to addresses)',
		emailFile: 'only_x_original_to',
		expectedText: 'test'
	},
	{
		description: 'an email with only a matching delivered-to address (no other candidate to addresses)',
		emailFile: 'only_delivered_to',
		expectedText: 'test'
	},
	{
		description: 'an email with no CodeStream address',
		emailFile: 'no_codestream_address',
		shouldFail: true
	},
	{
		description: 'an email with no text content, only html',
		emailFile: 'only_html',
		expectedText: 'test'
	},
	{
		description: 'an email with various html',
		emailFile: 'html',
		expectedText: 'paragraph\n\ndiv\n\n\n   between spaces   past spaces'
	},
	{
		description: 'an email with a "From:" reply',
		emailFile: 'with_from_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with a "wrote:" reply',
		emailFile: 'with_wrote_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with a "via" reply',
		emailFile: 'with_via_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with a "sender" reply',
		emailFile: 'with_sender_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with a "sender wrote" reply',
		emailFile: 'with_sender_wrote_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with an "on wrote" reply',
		emailFile: 'with_on_wrote_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with an "original message" reply',
		emailFile: 'with_original_message_reply',
		expectedText: 'test'
	},
	{
		description: 'an email with a signature',
		emailFile: 'with_signature',
		expectedText: 'test'
	},
	{
		description: 'an email with no text',
		emailFile: 'no_text',
		shouldFail: true
	}
];
