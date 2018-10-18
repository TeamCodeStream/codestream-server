// Provides a set of "ops" (or directives) that act on data in a certain way more sophisticated
// than just setting a value ... these correspond exactly with mongo ops, for now ... but if
// another database is employed there might be adjustments to be made

'use strict';

const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

var _Ops = {
	// set the value of a field, using a deep copy
	'$set': function(document, field, value) {
		document[field] = DeepClone(value);
	},

	// unset (delete) the value of a field
	'$unset': function(document, field, value) {
		if (value) {
			delete document[field];
		}
	},

	// add an element to an array, but only if the element is not already in the array
	// (as indicated by ===) ... we'll create the array as needed
	'$addToSet': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
		}
		if (!(value instanceof Array)) {
			value = [value];
		}
		value.forEach(elem => {
			if (
				document[field] instanceof Array &&
				!document[field].includes(elem)
			) {
				document[field].push(elem);
			}
		});
	},

	// push an element onto the end of an array, we'll create the array as needed
	'$push': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
		}
		if (document[field] instanceof Array) {
			if (!(value instanceof Array)) {
				value = [value];
			}
			document[field].push(...value);
		}
	},

	// pull an element from an array if it's in the array, as indicated by ===
	'$pull': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
			return;
		}
		if (document[field] instanceof Array) {
			let index = document[field].indexOf(value);
			if (index !== -1) {
				document[field].splice(index, 1);
			}
		}
	},

	// increment the value of a numeric attribute by a specified amount,
	// we'll make it a number if it doesn't exist
	'$inc': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = value;
			return;
		}
		if (typeof document[field] === 'number') {
			document[field] += value;
		}
	}
};

// here we support that you can change a value that is within an object, like:
// { $set: { "object.x", 1 } } ... to any level of nesting
var _subOp = function(opType, document, op, field) {
	let match = field.match(/^(.+)\.(.+)$/);
	if (match) {
		let [ , topField, subField ] = match;
		if (typeof document[topField] === 'undefined') {
			document[topField] = {};
		}
		if (typeof document[topField] === 'object') {
			_documentOpsHelper(opType, document[topField], { [subField]: op[field] });
		}
		return true;
	}
};

var _documentOpsHelper = function(opType, document, op) {
	if (typeof document !== 'object' || typeof op !== 'object') {
		return;
	}
	Object.keys(op).forEach(field => {
		if (!_subOp(opType, document, op, field)) {
			_Ops[opType](document, field, op[field]);
		}
	});
};

// given an update object with nested levels, translate into an update operation
// using mongo's dot notation to separate keys from sub-keys
var _flattenOp = function(opData, value, rootKey) {
	let op = {};
	for (let key in value) {
		if (value.hasOwnProperty(key)) {
			opData.totalKeys++;
			if (opData.totalKeys === opData.maxKeys) {
				// we have a limit on the number of keys that can be updated in one
				// request, just as a safeguard
				return 'too many keys';
			}
			const subValue = value[key];
			if (typeof subValue === 'object') {
				const subRoot = `${rootKey}${key}.`;
				const subOp = _flattenOp(opData, subValue, subRoot);
				if (typeof subOp === 'string') {
					return subOp;	// error
				}
				Object.assign(op, subOp);
			}
			else {
				op[rootKey + key] = subValue;
			}
		}
	}
	return op;
};

// handle a directive encountered in the hash, translating it into
// the op to pass in the database update operation
var _handleDirective = function(opData, key) {
	const value = opData.hash[key];
	if (typeof value !== 'object') {
		return key;
	}
	const subOp = _flattenOp(opData, value, opData.root);
	opData.op[key] = opData.op[key] || {};
	Object.assign(opData.op[key], subOp);
};

// handle a normal field value encountered, and translate into the op
// to pass in the database update operation
var _handleNonDirective = function(opData, key) {
	opData.op.$set = opData.op.$set || {};
	const subRoot = `${opData.root}${key}.`;
	const value = opData.hash[key];
	if (typeof value === 'object') {
		const subOp = _flattenOp(opData, value, subRoot);
		if (typeof subOp === 'string') {
			return subOp;	// error
		}
		Object.assign(opData.op.$set, subOp);

	}
	else {
		opData.op.$set[opData.root + key] = value;
	}
};

// handle the top-level key in a hash, turning it into an op
var _handleTopLevelKey = function(opData, key) {
	opData.totalKeys++;
	if (opData.totalKeys === opData.maxKeys) {
		// we have a limit on the number of keys that can be updated in one
		// request, just as a safeguard
		return 'too many keys';
	}
	if (key.startsWith('$')) {
		// a command directive like $set or $unset
		return _handleDirective(opData, key);
	}
	else {
		// an ordinary "set"
		return _handleNonDirective(opData, key);
	}
};

module.exports = {

	// apply an op to a model (or it can be an un-modelized object)
	applyOp: function(model, op) {
		if (typeof model !== 'object' || typeof model.attributes !== 'object' || typeof op !== 'object') {
			return;
		}
		Object.keys(op).forEach(opType => {
			if (typeof _Ops[opType] === 'function') {
				_documentOpsHelper(opType, model.attributes, op[opType]);
			}
		});
	},

	opFromHash: function(hash, rootKey, maxKeys) {
		// the hash can be a multi-level json object, but we'll update the database
		// using mongo's dot-notation
		const opData = {
			op: {},
			hash,
			root: `${rootKey}.`,
			maxKeys,
			totalKeys: 0
		};
		for (let key in hash) {
			if (hash.hasOwnProperty(key)) {
				const error = _handleTopLevelKey(opData, key);
				if (error) { return error; }
			}
		}
		return opData.op;
	},

	possibleOps: function() {
		return Object.keys(_Ops);
	}
};
