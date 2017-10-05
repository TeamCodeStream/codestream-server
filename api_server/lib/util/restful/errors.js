'use strict';

const ERRORS = {
	'internal': {
		code: 'RAPI-1000',
		message: 'Internal API error',
		internal: true
	},
	'parameter_required': {
		code: 'RAPI-1001',
		message: 'Parameter required'
	},
	'attribute_required': {
		code: 'RAPI-1002',
		message: 'Attribute required'
	},
	'not_found': {
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
	'bad_query': {
		code: 'RAPI-1006',
		message: 'Query not allowed'
	},
	'invalid_attribute': {
		code: 'RAPI-1007',
		message: 'Invalid attribute'
	},
	'missing_argument': {
		code: 'RAPI-1008',
		message: 'Missing argument',
		internal: true
	}
};

module.exports = ERRORS;
