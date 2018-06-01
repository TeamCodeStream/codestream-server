// Errors concerning restful operations

'use strict';

module.exports = {
	'internal': {
		code: 'RAPI-1000',
		message: 'Internal API error',
		internal: true,
		description: 'Usually the result of an unexpected server error'
	},
	'parameterRequired': {
		code: 'RAPI-1001',
		message: 'Parameter required',
		description: 'A parameter is required for this request, usually the parameter will be given in an info structure'
	},
	/* Deprecated
	'attributeRequired': {
		code: 'RAPI-1002',
		message: 'Attribute required'
	},
	*/
	'notFound': {
		code: 'RAPI-1003',
		message: 'Object not found',
		description: 'The requested object (often by ID) was not found'
	},
	'exists': {
		code: 'RAPI-1004',
		message: 'Object exists',
		description: 'An attempt was made to create an object, but the object already exists'
	},
	'validation': {
		code: 'RAPI-1005',
		message: 'Validation error',
		description: 'One or more attributes or parameters provided failed validation, more information is usually given in an info structure'
	},
	'badQuery': {
		code: 'RAPI-1006',
		message: 'Query not allowed',
		description: 'The query parameters sent with the request are not correct or not allowed'
	},
	/* Deprecated
	'invalidAttribute': {
		code: 'RAPI-1007',
		message: 'Invalid attribute'
	},
*/
	'missingArgument': {
		code: 'RAPI-1008',
		message: 'Missing argument',
		internal: true,
		description: 'An argument expected by an internal routine was not provided, more information will be given in an info structure'
	},
	'readAuth': {
		code: 'RAPI-1009',
		message: 'Not authorized to read',
		description: 'The current user is not authorized to read or get the requested resource'
	},
	'updateAuth': {
		code: 'RAPI-1010',
		message: 'Not authorized to update',
		description: 'The current user is not authorized to make the requested update'
	},
	'createAuth': {
		code: 'RAPI-1011',
		message: 'Not authorized to create',
		description: 'The current user is not authorized to create the requested object'
	},
	'invalidParameter': {
		code: 'RAPI-1012',
		message: 'Invalid parameter',
		description: 'An input parameter given to the request is invalid, usually more information is given in an info structure'
	},
	'deleteAuth': {
		code: 'RAPI-1013',
		message: 'Not authorized to delete',
		description: 'The current user is not authorized to delete the requested object'
	},
	'alreadyDeleted': {
		code: 'RAPI-1014',
		message: 'This object is already deleted',
		description: 'An attempt was made to delete an object that has already been deleted'
	}
};
