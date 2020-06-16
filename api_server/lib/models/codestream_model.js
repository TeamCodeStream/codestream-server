// base class for all CodeStream models

'use strict';

const DataModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model');
const CodeStreamModelValidator = require('./codestream_model_validator');
const ObjectID = require('mongodb').ObjectID;

class CodeStreamModel extends DataModel {

	// get the validator engine for CodeStream models
	getValidator () {
		return new CodeStreamModelValidator();
	}

	// set default attributes
	setDefaults () {
		super.setDefaults();
		const now = new Date().getTime();
		Object.assign(
			this.attributes,
			{
				createdAt: now,
				modifiedAt: now
			}
		);
		super.setDefaults();
	}

	// called just before a model is saved
	async preSave (options) {
		this.attributes.modifiedAt = new Date().getTime();
		await super.preSave(options);
	}

	// cheater function to force an attribute to be lowercase
	lowerCase (attribute) {
		if (typeof this.attributes[attribute] === 'string') {
			this.attributes[attribute] = this.attributes[attribute].toLowerCase();
		}
		else if (this.attributes[attribute] instanceof Array) {
			this.attributes[attribute] = this.attributes[attribute].map(elem => elem.toLowerCase());
		}
	}

	// cheater function to force an ID attribute to be lowercase
	lowerCaseNativeId (attribute) {
		if (typeof this.attributes[attribute] === 'string') {
			try {
				// this will harmlessly throw if it's not a valid mongo ID
				ObjectID(this.attributes[attribute]);
				this.toLowerCase(attribute);
			}
			catch (error) { error; }
		}
		else {
			this.lowerCase(attribute);
		}
	}
}


module.exports = CodeStreamModel;
