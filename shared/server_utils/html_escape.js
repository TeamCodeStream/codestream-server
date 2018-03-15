// provides basic html escaping functionality

'use strict';

const ENTITY_MAP = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

module.exports = {

	escapeHtml: function(text) {
		return String(text).replace(/[&<>"'`=/]/g, function (s) {
			return ENTITY_MAP[s];
		});
	}

};
