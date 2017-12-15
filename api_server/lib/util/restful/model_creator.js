'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ModelCreator {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};
	}

	createModel (attributes, callback) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			return callback(this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` }));
		}

		this.attributes = attributes;
		BoundAsync.series(this, [
			this.normalize,
			this.requireAttributes,
			this.validate,
			this.allowAttributes,
			this.checkExisting,
			this.preSave,
			this.checkValidationWarnings,
			this.createOrUpdate,
			this.postSave
		], (error) => {
	 		callback(error, this.model);
		});
	}

	normalize (callback) {
		process.nextTick(callback);
	}

	requireAttributes (callback) {
		let requiredAttributes = this.getRequiredAttributes() || [];
		let missingAttributes = [];
		requiredAttributes.forEach(attribute => {
			if (typeof this.attributes[attribute] === 'undefined') {
				missingAttributes.push(attribute);
			}
		});
		if (missingAttributes.length) {
			return callback(this.errorHandler.error('attributeRequired', { info: missingAttributes.join(',') }));
		}
		else {
			process.nextTick(callback);
		}
	}

	getRequiredAttributes () {
		return null;
	}

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

	validateAttributes (callback) {
		process.nextTick(callback);
	}

	allowAttributes (callback) {
		process.nextTick(callback);
	}

	checkExisting (callback) {
		let queryData = this.checkExistingQuery();
		if (!queryData) {
			return process.nextTick(callback);
		}
		this.collection.getOneByQuery(
			queryData.query,
			(error, model) => {
				if (error) { return callback(error); }
				if (model) {
					if (!this.modelCanExist(model)) {
						return callback(this.errorHandler.error('exists'));
					}
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

	checkExistingQuery () {
		return null;
	}

	modelCanExist (/*model*/) {
		return false;
	}

	preSave (callback) {
		if (this.existingModel) {
			if (this.dontSaveIfExists) {
				this.model = this.existingModel;
				return callback();
			}
			this.attributes = Object.assign({}, this.existingModel.attributes, this.attributes);
		}
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

	checkValidationWarnings (callback) {
		if (
			this.model.validationWarnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validationWarnings.join('\n')}`);
		}
		process.nextTick(callback);
	}

	createOrUpdate (callback) {
		if (this.existingModel) {
			this.update(callback);
		}
		else {
			this.create(callback);
		}
	}

	update (callback) {
		if (this.dontSaveIfExists) {
			this.model = this.existingModel;
			return process.nextTick(callback);
		}
		this.collection.update(
			this.model.attributes,
			(error, updatedModel) => {
				if (error) { return callback(error); }
				this.model = updatedModel;
				this.didExist = true;
				process.nextTick(callback);
			}
		);
	}

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

	postSave (callback) {
		process.nextTick(callback);
	}
}

module.exports = ModelCreator;
