// define the valid codemark types

'use strict';

const TYPES = [
	'comment',
	'issue',
	'question',
	'bookmark',
	'trap'
];

const TYPES_REQUIRING_MARKERS = [
	'bookmark',
	'trap'
];

const TYPES_REQUIRING_TEXT = [
	'comment',
	'trap'
];

const TYPES_REQUIRING_TITLE = [
	'question',
	'issue',
	'bookmark'
];

module.exports = {
	TYPES,
	TYPES_REQUIRING_MARKERS,
	TYPES_REQUIRING_TEXT,
	TYPES_REQUIRING_TITLE
};