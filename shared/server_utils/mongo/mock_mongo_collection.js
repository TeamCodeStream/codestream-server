'use strict';

const DeepEqual = require('deep-equal');
const DeepClone = require('../deep_clone');
const ObjectID = require('mongodb').ObjectID;

const ApplyProjection = function(document, projection) {
	let isExclude = null;
	const newDocument = {
		_id: document._id
	};
	Object.keys(projection).forEach(key => {
		if (projection[key]) {
			if (isExclude === true) {
				throw 'cannot have include and exclude field projection';
			}
			newDocument[key] = document[key];
			isExclude = false;
		}
		else {
			if (isExclude === false) {
				throw 'cannot have exclude and include field projection';
			}
			delete document[key];
			isExclude = true;
		}
	});
	if (isExclude) {
		return document;
	}
	else {
		return newDocument;
	}
};

class MockMongoCollection {

	constructor (options) {
		Object.assign(this, options);
		this.collection = [];
	}

	clearCache () {
		this.collection = [];
	}

	async findOne (query, options = {}) {
		let document = this.collection.find(item => {
			return this._itemMatchesQuery(item, query);
		}) || null;
		if (document && options.projection) {
			document = ApplyProjection(document, options.projection);
		}
		return document;
	}

	find (query) {
		let documents = this.collection.filter(item => {
			return this._itemMatchesQuery(item, query);
		});
		return new MockMongoCursor(documents);
	}

	async insertOne (document) {
		document = DeepClone(document);
		if (!document._id) {
			document._id = ObjectID();
		}
		this.collection.push(document);
		return document;
	}

	async insertMany (documents) {
		const createdDocuments = DeepClone(documents);
		createdDocuments.forEach(document => {
			if (!document._id) {
				document._id = ObjectID();
			}
		});
		this.collection = [...this.collection, ...createdDocuments];
		return {
			ops: createdDocuments
		};
	}

	async updateOne (query, update, options = {}) {
		const document = await this.findOne(query);
		if (document) {
			this.updateDocument(document, update);
		}
		else if (options.upsert) {
			const documentToInsert = {};
			if (query._id) {
				documentToInsert._id = query._id;
			}
			const document = await this.insertOne(documentToInsert);
			await this.updateOne({ _id: document._id }, update);
		}
	}

	async updateMany (query, update, options = {}) {
		let documents = await this.find(query).toArray();
		if (documents.length > 0) {
			for (var document of documents) {
				this.updateDocument(document, update);
			}
		}
		else if (options.upsert) {
			const documentToInsert = {};
			if (query._id) {
				documentToInsert._id = query._id;
			}
			const document = await this.insertOne(documentToInsert);
			await this.updateOne({ _id: document._id }, update);
			documents = [document];
		}
		return {
			modifiedCount: documents.length
		};
	}

	async findOneAndUpdate (query, update) {
		const document = await this.findOne(query);
		let result = null;
		if (document) {
			result = DeepClone(document);
			this.updateDocument(document, update);
		}
		return {
			value: result
		};
	}

	async deleteOne (query) {
		const index = this.collection.findIndex(item => {
			return this._itemMatchesQuery(item, query);
		});
		if (index !== -1) {
			this.collection.splice(index, 1);
		}
	}

	async deleteMany (query) {
		for (let i = this.collection.length - 1; i >= 0; i--) {
			if (this._itemMatchesQuery(this.collection[i], query)) {
				this.collection.splice(i, 1);
			}
		}
	}

	updateDocument (document, update) {
		this._sanitizeUpdate(update);
		Object.keys(update).forEach(attribute => {
			if (attribute.startsWith('$')) {
				return this._applyDirective(document, attribute, update[attribute]);
			}
			else if (typeof update[attribute] === 'object') {
				document[attribute] = DeepClone(update[attribute]);
			}
			else {
				document[attribute] = update[attribute];
			}
		});
	}

	_sanitizeUpdate (update) {
		let setKeys = [], unsetKeys = [];
		if (update.$set) {
			setKeys = Object.keys(update.$set);
		}
		if (update.$unset) {
			unsetKeys = Object.keys(update.$unset);
		}
		if (setKeys.find(key => unsetKeys.includes(key))) {
			throw {
				name: 'MongoError'
			};
		}
	}

	_itemMatchesQuery (item, query) {
		return !Object.keys(query).find(condition => {
			return !this._itemMatchesCondition(item, condition, query[condition]);
		});
	}

	_itemMatchesCondition (item, conditionName, conditionValue) {
		if (conditionName.startsWith('$')) {
			return this._itemMatchesOperator(item, conditionName, conditionValue);
		}
		else if (
			typeof conditionValue === 'object' &&
			conditionValue.$exists !== undefined
		) {
			return this._itemMatchesExists(item, conditionName, conditionValue.$exists);
		}
		const keys = conditionName.split('.');
		const topKey = keys[0];
		if (item[topKey] === undefined) {
			return false;
		}
		if (keys.length === 1) {
			return this._valueMatches(item[topKey], conditionValue);
		}
		else if (typeof item[topKey] !== 'object') {
			return false;
		}
		return this._itemMatchesCondition(item[topKey], conditionValue);
	}

	_itemMatchesExists (item, field, exists) {
		const keys = field.split('.');
		const topKey = keys[0];
		if (item[topKey] === undefined) {
			return exists ? false : true;
		}
		else if (keys.length === 1) {
			return (
				(exists && item[topKey] !== undefined) ||
				(!exists && item[topKey] === undefined)
			);
		}
		else {
			const subKey = keys.slice(1).join('.');
			return this._itemMatchesExists(item[topKey], subKey, exists);
		}
	}

	_valueMatches (value, conditionValue) {
		if (
			typeof conditionValue === 'object' &&
			Object.keys(conditionValue).find(key => key.startsWith('$'))
		) {
			return this._valueMatchesOperators(value, conditionValue);
		}
		else if (value instanceof Array && !(conditionValue instanceof Array)) {
			return value.includes(conditionValue);
		}
		else {
			return this._valuesAreEqual(value, conditionValue);
		}
	}

	_valueMatchesOperators (value, conditionValue) {
		if (Object.keys(conditionValue).find(key => !key.startsWith('$'))) {
			throw 'condition value must have only operators';
		}
		return !Object.keys(conditionValue).find(conditionOperator => {
			return !this._valueMatchesOperator(value, conditionOperator, conditionValue[conditionOperator]);
		});
	}

	_valueMatchesOperator (value, operator, operand) {
		switch (operator) {

		case '$in':
			if (!(operand instanceof Array)) {
				throw 'operand must be array';
			}
			return this._valueIn(operand, value);

		case '$nin':
			if (!(operand instanceof Array)) {
				throw 'operand must be array';
			}
			return !this._valueIn(operand, value);

		case '$exists':
			return operand ? value !== undefined : value === undefined;

		case '$lt': 
			return value < operand;
		
		case '$gt':
			return value > operand;

		case '$lte':
			return value <= operand;

		case '$gte':
			return value >= operand;

		case '$eq':
			return DeepEqual(value, operand);

		case '$ne':
			return !DeepEqual(value, operand);

		default:
			throw `unknown operator ${operator}`;
		}
	}

	_valueIn (arr, value) {
		return arr.find(elem => {
			if (value instanceof Array) {
				return value.find(valueElem => {
					return this._valuesAreEqual(valueElem, elem);
				});
			}
			else {
				return this._valuesAreEqual(value, elem);
			}
		});
	}

	_valuesAreEqual (val1, val2) {
		if (
			typeof val1 === 'object' &&
			!(val1 instanceof RegExp) && 
			typeof val1.toString === 'function'
		) {
			val1 = val1.toString();
		}
		if (
			typeof val2 === 'object' &&
			!(val2 instanceof RegExp) && 
			typeof val2.toString === 'function'
		) {
			val2 = val2.toString();
		}

		if (val1 instanceof RegExp && typeof val2 === 'string') {
			return !!val2.match(val1);
		}
		else if (val2 instanceof RegExp && typeof val1 === 'string') {
			return !!val1.match(val2);
		}
		else {
			return DeepEqual(val1, val2);
		}
	}

	_itemMatchesOperator (item, conditionName, conditionValue) {
		if (conditionName === '$and') {
			return this._itemMatchesAnd(item, conditionValue);
		}
		else if (conditionName === '$or') {
			return this._itemMatchesOr(item, conditionValue);
		}
		else {
			throw `unknown operator ${conditionName}`;
		}
	}

	_itemMatchesAnd (item, conditionValue) {
		if (!(conditionValue instanceof Array)) {
			throw '$and value is not an array';
		}
		return !conditionValue.find(elem => {
			if (typeof elem !== 'object') {
				throw '$and element is not an object';
			}
			return !this._itemMatchesQuery(item, elem);
		});
	}

	_itemMatchesOr (item, conditionValue) {
		if (!(conditionValue instanceof Array)) {
			throw '$or value is not an array';
		}
		return conditionValue.find(elem => {
			if (typeof elem !== 'object') {
				throw '$or element is not an object';
			}
			return this._itemMatchesQuery(item, elem);
		});
	}

	_applyDirective (document, directive, value) {
		if (typeof value !== 'object') {
			throw 'operand of directive must be an object';
		}
		Object.keys(value).forEach(attribute => {
			const keys = attribute.split('.');
			const topKey = keys[0];
			if (keys.length > 1) {
				if (directive !== '$unset' && document[topKey] === undefined) {
					document[topKey] = {};
				}
				if (typeof document[topKey] === 'object') {
					const subKey = keys.slice(1).join('.');
					this._applyDirective(document[topKey], directive, { [subKey]: value[attribute] });
				}
			}
			else {
				switch (directive) {
				case '$set': 
					return this._applySet(document, attribute, value[attribute]);
				case '$unset': 
					return this._applyUnset(document, attribute, value[attribute]);
				case '$addToSet': 
					return this._applyAddToSet(document, attribute, value[attribute]);
				case '$push': 
					return this._applyPush(document, attribute, value[attribute]);
				case '$pull': 
					return this._applyPull(document, attribute, value[attribute]);
				case '$inc': 
					return this._applyInc(document, attribute, value[attribute]);
				default:
					throw `unknown directive ${directive}`;
				}
			}
		});
	}

	_applySet (document, attribute, value) {
		document[attribute] = value;
	}

	_applyUnset (document, attribute, value) {
		if (value) {
			delete document[attribute];
		}
	}

	_applyAddToSet (document, attribute, value) {
		if (document[attribute] === undefined) {
			document[attribute] = [];
		}
		if (!(document[attribute] instanceof Array)) {
			return;
		}
		if (
			typeof value === 'object' &&
			value.$each instanceof Array 
		) {
			value = value.$each;
		}
		else {
			value = [value];
		}
		for (let addValue of value) {
			if (!document[attribute].includes(addValue)) {
				document[attribute].push(addValue);
			}
		}
	}

	_applyPush (document, attribute, value) {
		if (document[attribute] === undefined) {
			document[attribute] = [];
		}
		if (!(document[attribute] instanceof Array)) {
			return;
		}
		if (
			typeof value === 'object' &&
			value.$each instanceof Array
		) {
			value = value.$each;
		}
		else {
			value = [value];
		}
		document[attribute] = [...document[attribute], ...value];
	}

	_applyPull (document, attribute, value) {
		if (!(document[attribute] instanceof Array)) {
			return;
		}
		if (
			typeof value === 'object' &&
			value.$in instanceof Array
		) {
			value = value.$in;
		}
		else {
			value = [value];
		}
		for (let pullValue of value) {
			const index = document[attribute].indexOf(pullValue);
			if (index !== -1) {
				document[attribute].splice(index, 1);
			}
		}
	}

	_applyInc (document, attribute, value) {
		if (
			document[attribute] === undefined ||
			typeof document[attribute] === 'number'
		) {
			document[attribute] = (document[attribute] || 0) + value;
		}
	}
}

class MockMongoCursor {

	constructor (documents) {
		this.documents = documents;
	}

	sort (sort) {
		this.documents = this._sortDocuments(this.documents, sort);
		return this;
	} 

	limit (limit) {
		this.documents = this.documents.slice(0, limit);
		return this;
	}

	project (project) {
		if (project && Object.keys(project).length > 0) {
			this.documents = this.documents.map(document => {
				return ApplyProjection(document, project);
			});
		}
		return this;
	}

	async toArray () {
		return this.documents;
	}

	_sortDocuments (documents, sort) {
		return documents.sort((a, b) => {
			return this._sortOrder(a, b, sort);
		});
	}

	_sortOrder (a, b, sort) {
		for (var sortKey in sort) {
			const sortOrder = this._sortOrderByKey(a, b, sortKey, sort[sortKey]);
			if (sortOrder) {
				return sortOrder;
			}
		}
		return 0;
	}

	_sortOrderByKey (aDoc, bDoc, sortKey, sortValue) {
		const a = aDoc[sortKey];
		const b = bDoc[sortKey];
		if (typeof a === 'string' && typeof b === 'string') {
			return sortValue >= 0 ? 
				a.localeCompare(b) :
				b.localeCompare(a);
		}
		else if (typeof a === 'number' && typeof b === 'number') {
			return sortValue >= 0 ?
				this._numberCompare(a, b) : 
				this._numberCompare(b, a);
		}
		else 
			return 0;
	}

	_numberCompare (a, b) {
		if (a > b) return 1;
		else if (a < b) return -1;
		else return 0;
	}
}

module.exports = MockMongoCollection;