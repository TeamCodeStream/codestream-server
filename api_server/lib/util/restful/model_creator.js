// provides an abstract base class to handle the creation of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process

'use strict';

const RequireAllow = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/require_allow');
const DeepEqual = require('deep-equal');
const ModelSaver = require('./model_saver');

class ModelCreator {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
	}

	// create the model
	async createModel (attributes) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			throw this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` });
		}

		this.attributes = attributes;
		await this.normalize();					// normalize the input attributes
		await this.requireAllowAttributes();	// check for required attributes and attributes to ignore
		await this.validate();					// validate the attributes
		await this.checkExisting();				// check if there is already a matching document, according to the derived class
		await this.preSave();					// prepare to save the document
		if (this.suppressSave) {
			this.model = new this.modelClass(this.attributes);
			return this.model;
		}
		this.checkValidationWarnings();			// check for any validation warnings that came up in preSave
		await this.createOrUpdate();			// create the document, or if already existed, we might want to update it
		await this.postSave();					// give the derived class a chance to do stuff after we've saved
		return this.model;
	}

	// normalize the input attributes ... override as needed
	async normalize () {
	}

	// check that we have all the required attributes, and ignore any attributes except those that are allowed
	async requireAllowAttributes () {
		const attributes = this.getRequiredAndOptionalAttributes();
		if (!attributes) { return; }
		const info = RequireAllow.requireAllow(this.attributes, attributes);
		if (!info) { return; }
		if (info.missing) {
			throw this.errorHandler.error('parameterRequired', { info: info.missing.join(',') });
		}
		else if (info.invalid) {
			throw this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') });
		}
		else if (info.deleted && this.api) {
			this.api.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
		}
	}

	// which attributes are required? override to specify
	getRequiredAndOptionalAttributes () {
		return null;
	}

	// validate the input attributes
	async validate () {
		const error = await this.validateAttributes();
		if (error) {
			throw this.errorHandler.error('validation', { info: error });
		}
	}

	// validate the input attributes ... override as needed
	async validateAttributes () {
	}

	// check if there is a matching document already, according to a query specified
	// by the derived class, which can also decide whether this is allowed or not
	async checkExisting () {
		const queryData = this.checkExistingQuery();
		if (!queryData) {
			// derived class doesn't care
			return;
		}
		// look for a matching document, according to the query
		const options = {
			hint: queryData.hint
		};
		const model = await this.collection.getOneByQuery(queryData.query, options);
		if (model) {
			// got a matching document, is this ok?
			if (!this.modelCanExist(model)) {	// derived class tells us whether this is allowed
				throw this.errorHandler.error('exists');
			}
			// ok, it's allowed
			this.existingModel = model;
		}
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
	async preSave () {
		if (this.existingModel) {
			if (this.dontSaveIfExists) {
				// we have a document that matches the input attributes, and there's no need
				// to make any changes, just pass it back to the client as-is
				this.model = this.existingModel;
				return;
			}
			// override with the attributes passed in, we'll save these
			this.attributes = Object.assign({}, this.existingModel.attributes, this.attributes, { id: this.existingModel.id });
		}
		else if (this.useId) {
			this.attributes.id = this.useId;
		}
		// create a new model with the passed attributes, and let the model pre-save itself ...
		// this is where pre-save validation of the attributes happens
		this.model = new this.modelClass(this.attributes);
		try {
			await this.model.preSave({ new: !this.existingModel });
		}
		catch (error) {
			throw this.errorHandler.error('validation', { info: error });
		}
	}

	// check for any warnings during validation, these don't stop the document from
	// getting saved but we'll want to log them anyway
	checkValidationWarnings () {
		if (
			this.model.validationWarnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validationWarnings.join('\n')}`);
		}
	}

	// create the document, or update it if we found an existing matching document
	async createOrUpdate () {
		if (this.existingModel) {
			await this.update();
		}
		else {
			await this.create();
		}
	}

	// update an existing document that matches the input attributes
	async update () {
		if (this.dontSaveIfExists) {
			// or don't bother if the derived class says so
			this.model = this.existingModel;
			return;
		}
		await this.determineChanges();
		await this.doUpdate();
	}

	// determine what is actually changing, for a save
	async determineChanges () {
		this.changes = {};
		Object.keys(this.model.attributes).forEach(attribute => {
			if (attribute === 'id' || attribute === '_id') { return; }
			if (!this.attributesAreEqual(
				this.existingModel.get(attribute),
				this.model.get(attribute))
			) {
				this.changes[attribute] = this.model.get(attribute);
			}
		});
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
	async doUpdate () {
		if (Object.keys(this.changes).length === 0) {
			// nothing to save
			return;
		}
		// do the update
		const op = { $set: this.changes };
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.collection,
			id: this.existingModel.id
		}).save(op);
	}

	// requisition an ID for the model we are about to create ... use this if you need
	// to know the ID ahead of time
	createId () {
		this.attributes.id = this.useId || this.collection.createId();
	}

	// truly create a new document
	async create () {
		this.model = await this.collection.create(this.model.attributes);
	}

	// override to do stuff after the document has been saved
	async postSave () {
	}

	// override to do stuff after a response has been returned to the client
	async postCreate () {
	}
}

module.exports = ModelCreator;
