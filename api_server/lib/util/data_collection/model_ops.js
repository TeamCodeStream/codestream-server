'use strict';

var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');

var _Ops = {
	'$set': function(document, field, value) {
		document[field] = DeepClone(value);
	},

	'$unset': function(document, field, value) {
		if (value) {
			delete document[field];
		}
	},

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
				document[field].indexOf(elem) === -1
			) {
				document[field].push(elem);
			}
		});
	},

	'$push': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
		}
		if (document[field] instanceof Array) {
			document[field].push(value);
		}
	},

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

	'$inc': function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = 0;
			return;
		}
		if (typeof document[field] === 'number') {
			document[field] += value;
		}
	}
};

var _documentOpsHelper; // make jshint happy

var _subOp = function(opType, document, op, field) {
	let match = field.match(/^(.+)\.(.+)$/);
	if (match) {
		let [ , topField, subField ] = match;
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


module.exports = {

	'$set': function(model, set) {
		_documentOpsHelper('set', model.attributes, set);
	},

	'$unset': function(model, set) {
		_documentOpsHelper('unset', model.attributes, set);
	},

	'$addToSet': function(model, set) {
		_documentOpsHelper('add', model.attributes, set);
	},

	'$push': function(model, set) {
		_documentOpsHelper('push', model.attributes, set);
	},

	'$pull': function(model, set) {
		_documentOpsHelper('pull', model.attributes, set);
	},

	'$inc': function(model, set) {
		_documentOpsHelper('inc', model.attributes, set);
	},

	applyOp: function(model, op) {
		if (typeof model !== 'object' || typeof model.attributes !== 'object' || typeof op !== 'object') {
			return;
		}
		Object.keys(op).forEach(opType => {
			if (typeof _Ops[opType] === 'function') {
				_documentOpsHelper(opType, model.attributes, op[opType]);
			}
		});
	}
};
