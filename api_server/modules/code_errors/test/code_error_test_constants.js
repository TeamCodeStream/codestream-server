// test constants for testing the code errors module

'use strict';

const CodeErrorAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/code_error_attributes');

const EXPECTED_BASE_CODE_ERROR_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'postId',
	'status',
	'numReplies',
	'lastActivityAt',
	'stackTrace',
	'providerUrl'
];

const EXPECTED_CODE_ERROR_FIELDS = EXPECTED_BASE_CODE_ERROR_FIELDS.concat([
]);

const UNSANITIZED_ATTRIBUTES = Object.keys(CodeErrorAttributes).filter(attribute => {
	return CodeErrorAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_BASE_CODE_ERROR_FIELDS,
	EXPECTED_CODE_ERROR_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
