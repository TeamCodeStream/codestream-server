// provide a validator for stream attributes

'use strict';

var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities.js');
const UserAttributes = require('./user_attributes');

class UserValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, UserAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}

	// set validation function specific to user attributes
	setValidationFunctions () {
		super.setValidationFunctions();
		Object.assign(this.validationFunctions, {
			email: this.validateEmail.bind(this),
			arrayOfEmails: this.validateArrayOfEmails.bind(this),
			username: this.validateUsername.bind(this)
		});
	}

	// validate a user's email
	validateEmail (value, definition/*, options*/) {
		definition = definition || this.attributeDefinitions.email;
		let error = EmailUtilities.parseEmail(value);
		if (typeof error === 'string') {
			return error;
		}
		if (
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'must be less than ' + definition.maxLength + ' characters';
		}
	}

	// validate an array of emails
	validateArrayOfEmails (value, definition/*, options*/) {
		definition = definition || this.attributeDefinitions.emails;
		if (!(value instanceof Array)) {
			return 'must be an array';
		}
		let invalidEmails = [];
		let emailDefinition = {
			maxLength: definition.maxEmailLength || null
		};
		value.forEach(email => {
			let error = this.validateEmail(email, emailDefinition);
			if (error) {
				invalidEmails.push(`${email}: ${error}`);
			}
		});

		if (invalidEmails.length > 0) {
			return invalidEmails.join(',');
		}
	}

	// validate a user's username
	validateUsername (value, definition/*, options*/) {
		definition = definition || this.attributeDefinitions.username;
		if (typeof value !== 'string' || value.length === 0) {
			return 'must be a string';
		}
		let upper = definition.lowercaseOnly ? '' : 'A-Z';
		let regexp = new RegExp(`^[${upper}a-z0-9-._]+$`);
		if (!regexp.test(value)) {
			return 'can only contain alphanumerics, hyphen, period, and underscore';
		}
	}

	// validate a password
	validatePassword (value) {
		if (typeof value !== 'string' || value.length < 6) {
			return 'must be at least six characters';
		}
	}
}

module.exports = UserValidator;
