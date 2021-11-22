// test constants for testing the code errors module

'use strict';

const CodeErrorAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/code_error_attributes');

const EXPECTED_CODE_ERROR_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'streamId',
	'postId',
	'numReplies',
	'lastActivityAt',
	'accountId',
	'objectId',
	'objectType',
	'permalink'
];

const EXPECTED_CODE_ERROR_WITH_STACK_TRACE_FIELDS = EXPECTED_CODE_ERROR_FIELDS.concat([
	'stackTraces'
]);

const UNSANITIZED_ATTRIBUTES = Object.keys(CodeErrorAttributes).filter(attribute => {
	return CodeErrorAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_CODE_ERROR_FIELDS,
	EXPECTED_CODE_ERROR_WITH_STACK_TRACE_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
