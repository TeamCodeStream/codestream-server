'use strict';

const EXPECTED_POST_FIELDS = [
	'_id',
	'org_id',
	'text'
];

const EXPECTED_POST_FIELDS_BY_TYPE = {
	group: [
		'group_id'
	],
	reply: [
		'parent_post_id'
	],
	repo: [
		'repo'
	],
	file: [
		'repo',
		'path'
	],
	commit: [
		'repo',
		'path',
		'commit_id'
	],
	patch: [
		'repo',
		'path',
		'patch_id'
	],
	diff: [
		'repo',
		'path',
		'diff_id'
	]
};

const EXPECTED_POST_POSITION_FIELDS = [
	'line_start',
	'line_end',
	'char_start',
	'char_end'
];

const WANT_POSITION = {
	group: false,
	reply: false,
	repo: false,
	file: true,
	commit: true,
	patch: true,
	diff: true
};

module.exports = {
	EXPECTED_POST_FIELDS,
	EXPECTED_POST_FIELDS_BY_TYPE,
	EXPECTED_POST_POSITION_FIELDS,
	WANT_POSITION
};
