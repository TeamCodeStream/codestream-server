// Errors concerning restful operations

'use strict';

const ERRORS = {
	'internal': {
		code: 'RAPI-1000',
		message: 'Internal API error',
		internal: true
	},
	'parameterRequired': {
		code: 'RAPI-1001',
		message: 'Parameter required'
	},
	'attributeRequired': {
		code: 'RAPI-1002',
		message: 'Attribute required'
	},
	'notFound': {
		code: 'RAPI-1003',
		message: 'Object not found'
	},
	'exists': {
		code: 'RAPI-1004',
		message: 'Object exists'
	},
	'validation': {
		code: 'RAPI-1005',
		message: 'Validation error'
	},
	'badQuery': {
		code: 'RAPI-1006',
		message: 'Query not allowed'
	},
	'invalidAttribute': {
		code: 'RAPI-1007',
		message: 'Invalid attribute'
	},
	'missingArgument': {
		code: 'RAPI-1008',
		message: 'Missing argument',
		internal: true
	},
	'readAuth': {
		code: 'RAPI-1009',
		message: 'Not authorized to read'
	},
	'updateAuth': {
		code: 'RAPI-1010',
		message: 'Not authorized to update'
	},
	'createAuth': {
		code: 'RAPI-1011',
		message: 'Not authorized to create'
	},
	'invalidParameter': {
		code: 'RAPI-1012',
		message: 'Invalid parameter'
	}
};

module.exports = ERRORS;
