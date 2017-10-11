'use strict';

var Deep_Clone = require(process.env.CI_API_TOP + '/lib/util/deep_clone');

var _Ops = {
	set: function(document, field, value) {
		document[field] = Deep_Clone(value);
	},

	unset: function(document, field, value) {
		if (value) {
			delete document[field];
		}
	},

	add: function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
		}
		if (
			document[field] instanceof Array &&
			document[field].indexOf(value) === -1
		) {
			document[field].push(value);
		}
	},

	push: function(document, field, value) {
		if (typeof document[field] === 'undefined') {
			document[field] = [];
		}
		if (document[field] instanceof Array) {
			document[field].push(value);
		}
	},

	pull: function(document, field, value) {
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
	}
};

var _document_ops_helper; // make jshint happy

var _sub_op = function(op_type, document, op, field) {
	let match = field.match(/^(.+)\.(.+)$/);
	if (match) {
		let [ , top_field, sub_field ] = match;
		if (typeof document[top_field] === 'object') {
			_document_ops_helper(op_type, document[top_field], { [sub_field]: op[field] });
		}
		return true;
	}
};

var _document_ops_helper = function(op_type, document, op) {
	if (typeof document !== 'object' || typeof op !== 'object') {
		return;
	}
	Object.keys(op).forEach(field => {
		if (!_sub_op(op_type, document, op, field)) {
			_Ops[op_type](document, field, op[field]);
		}
	});
};


module.exports = {

	set: function(model, set) {
		_document_ops_helper('set', model.attributes, set);
	},

	unset: function(model, set) {
		_document_ops_helper('unset', model.attributes, set);
	},

	add: function(model, set) {
		_document_ops_helper('add', model.attributes, set);
	},

	push: function(model, set) {
		_document_ops_helper('push', model.attributes, set);
	},

	pull: function(model, set) {
		_document_ops_helper('pull', model.attributes, set);
	},

	apply_op: function(model, op) {
		if (typeof model !== 'object' || typeof model.attributes !== 'object' || typeof op !== 'object') {
			return;
		}
		Object.keys(op).forEach(op_type => {
			if (typeof _Ops[op_type] === 'function') {
				_document_ops_helper(op_type, model.attributes, op[op_type]);
			}
		});
	}
};
