// provides an abstract base class to handle the creation of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
const DeepEqual = require('deep-equal');

class ModelCreator {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};	// additional material we want to get returned to the client
	}

	// create the model
	createModel (attributes, callback) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			return callback(this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` }));
		}

		this.attributes = attributes;
		BoundAsync.series(this, [
			this.normalize,				// normalize the input attributes
			this.requireAllowAttributes,	// check for required attributes and attributes to ignore
			this.validate,				// validate the attributes
			this.checkExisting,			// check if there is already a matching document, according to the derived class
			this.preSave,				// prepare to save the document
			this.checkValidationWarnings,	// check for any validation warnings that came up in preSave
			this.createOrUpdate,		// create the document, or if already existed, we might want to update it
			this.postSave				// give the derived class a chance to do stuff after we've saved
		], (error) => {
			callback(error, this.model);
		});
	}

	// normalize the input attributes ... override as needed
	normalize (callback) {
		process.nextTick(callback);
	}

	// check that we have all the required attributes, and ignore any attributes except those that are allowed
	requireAllowAttributes (callback) {
		let attributes = this.getRequiredAndOptionalAttributes();
		if (attributes) {
			let info = RequireAllow.requireAllow(this.attributes, attributes);
			if (!info) {
				return callback();
			}
			if (info.missing) {
				return callback(this.errorHandler.error('parameterRequired', { info: info.missing.join(',') }));
			}
			else if (info.invalid) {
				return callback(this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') }));
			}
			else if (info.deleted && this.api) {
				this.api.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
			}
		}
		process.nextTick(callback);
	}

	// which attributes are required? override to specify
	getRequiredAndOptionalAttributes () {
		return null;
	}

	// validate the input attributes
	validate (callback) {
		this.validateAttributes((errors) => {
			if (errors) {
				if (!(errors instanceof Array)) {
					errors = [errors];
				}
				return callback(this.errorHandler.error('validation', { info: errors }));
			}
			else {
				return process.nextTick(callback);
			}
		});
	}

	// validate the input attributes ... override as needed
	validateAttributes (callback) {
		process.nextTick(callback);
	}

	// check if there is a matching document already, according to a query specified
	// by the derived class, which can also decide whether this is allowed or not
	checkExisting (callback) {
		let queryData = this.checkExistingQuery();
		if (!queryData) {
			// derived class doesn't care
			return process.nextTick(callback);
		}
		// look for a matching document, according to the query
		this.collection.getOneByQuery(
			queryData.query,
			(error, model) => {
				if (error) { return callback(error); }
				if (model) {
					// got a matching document, is this ok?
					if (!this.modelCanExist(model)) {	// derived class tells us whether this is allowed
						return callback(this.errorHandler.error('exists'));
					}
					// ok, it's allowed
					this.existingModel = model;
				}
				return process.nextTick(callback);
			},
			{
				databaseOptions: {
					hint: queryData.hint
				}
			}
		);
	}

	// override to provide a query to check for a document matching the input attributes
	checkExistingQuery () {
		return null;
	}

	// override to say that there can be a document matching the input attributes, otherwise
	// if a match is found the creation will fail
	modelCanExist (/*model*/) {
		return false;
	}

	// right before the document gets saved....
	preSave (callback) {
		if (this.existingModel) {
			if (this.dontSaveIfExists) {
				// we have a document that matches the input attributes, and there's no need
				// to make any changes, just pass it back to the client as-is
				this.model = this.existingModel;
				return callback();
			}
			// override with the attributes passed in, we'll save these
			this.attributes = Object.assign({}, this.existingModel.attributes, this.attributes);
		}
		// create a new model with the passed attributes, and let the model pre-save itself ...
		// this is where pre-save validation of the attributes happens
		this.model = new this.modelClass(this.attributes);
		this.model.preSave(
			(errors) => {
				if (errors) {
					if (!(errors instanceof Array)) {
						errors = [errors];
					}
					return callback(this.errorHandler.error('validation', { info: errors }));
				}
				else {
					return process.nextTick(callback);
				}
			},
			{
				new: !this.existingModel
			}
		);
	}

	// check for any warnings during validation, these don't stop the document from
	// getting saved but we'll want to log them anyway
	checkValidationWarnings (callback) {
		if (
			this.model.validationWarnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validationWarnings.join('\n')}`);
		}
		process.nextTick(callback);
	}

	// create the document, or update it if we found an existing matching document
	createOrUpdate (callback) {
		if (this.existingModel) {
			this.update(callback);
		}
		else {
			this.create(callback);
		}
	}

	// update an existing document that matches the input attributes
	update (callback) {
		if (this.dontSaveIfExists) {
			// or don't bother if the derived class says so
			this.model = this.existingModel;
			return process.nextTick(callback);
		}
		BoundAsync.series(this, [
			this.determineChanges,
			this.doUpdate
		], callback);
	}

	// determine what is actually changing, for a save
	determineChanges (callback) {
		this.changes = {};
		Object.keys(this.model.attributes).forEach(attribute => {
			if (!this.attributesAreEqual(
				this.existingModel.get(attribute),
				this.model.get(attribute))
			) {
				this.changes[attribute] = this.model.get(attribute);
			}
		});
		process.nextTick(callback);
	}

	attributesAreEqual (attribute1, attribute2) {
		if (typeof attribute1 === 'object' && typeof attribute2 === 'object') {
			return DeepEqual(attribute1, attribute2, { strict: true });
		}
		else {
			return attribute1 === attribute2;
		}
	}

	// do the actual update, for a save, based on the determined changes
	doUpdate (callback) {
		if (Object.keys(this.changes).length === 0) {
			// nothing to save
			return callback();
		}
		// do the update
		this.collection.applyOpById(
			this.model.id,
			{ $set: this.changes },
			(error, updatedModel) => {
				if (error) { return callback(error); }
				this.model = updatedModel;
				this.didExist = true;	// caller might want to know whether we really created a document or not
				process.nextTick(callback);
			}
		);
	}

	// truly create a new document
	create (callback) {
		this.collection.create(
			this.model.attributes,
			(error, createdModel) => {
				if (error) { return callback(error); }
				this.model = createdModel;
				process.nextTick(callback);
			}
		);
	}

	// override to do stuff after the document has been saved
	postSave (callback) {
		process.nextTick(callback);
	}

	// override to do stuff after a response has been returned to the client
	postCreate (callback) {
		process.nextTick(callback);
	}
}

module.exports = ModelCreator;
