'use strict';

var CodeStream_Model_Validator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var Email_Utilities = require(process.env.CS_API_TOP + '/lib/util/email_utilities.js');
const User_Attributes = require('./user_attributes');

class User_Validator extends CodeStream_Model_Validator {

	constructor (attribute_definitions) {
		let total_attribute_definitions = Object.assign({}, User_Attributes, attribute_definitions);
		super(total_attribute_definitions);
	}

	set_validation_functions () {
		super.set_validation_functions();
		Object.assign(this.validation_functions, {
			email: this.validate_email.bind(this),
			array_of_emails: this.validate_array_of_emails.bind(this),
			username: this.validate_username.bind(this)
		});
	}

	validate_email (value, definition/*, options*/) {
		definition = definition || this.attribute_definitions.email;
		let error = Email_Utilities.parse_email(value);
		if (typeof error === 'string') {
			return error;
		}
		if (
			definition.max_length &&
			value.length > definition.max_length
		) {
			return 'must be less than ' + definition.max_length + ' characters';
		}
	}

	validate_array_of_emails (value, definition/*, options*/) {
		definition = definition || this.attribute_definitions.emails;
		if (!(value instanceof Array)) {
			return 'must be an array';
		}
		let invalid_emails = [];
		let email_definition = {
			max_length: definition.max_email_length || null
		};
		value.forEach(email => {
			let error = this.validate_email(email, email_definition);
			if (error) {
				invalid_emails.push(`${email}: ${error}`);
			}
		});

		if (invalid_emails.length > 0) {
			return invalid_emails.join(',');
		}
	}

	validate_username (value, definition/*, options*/) {
		definition = definition || this.attribute_definitions.username;
		if (typeof value !== 'string' || value.length === 0) {
			return 'must be a string';
		}
		let upper = definition.lowercase_only ? '' : 'A-Z';
		let regexp = new RegExp(`^[${upper}a-z0-9\-\._]+$`);
		if (!regexp.test(value)) {
			return 'can only contain alphanumerics, hyphen, period, and underscore';
		}
	}

	validate_password (value) {
		if (typeof value !== 'string' || value.length < 6) {
			return 'must be at least six characters';
		}
	}
}

module.exports = User_Validator;
