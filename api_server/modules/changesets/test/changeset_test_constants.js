// test constants for testing the markers module

'use strict';

const ChangesetAttributes = require(process.env.CS_API_TOP + '/modules/changesets/changeset_attributes');

const EXPECTED_CHANGESET_FIELDS = [
	'id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'repoId',
	'reviewId',
	'branch',
	'commits',
	'diffs',
	'modifiedFiles',
	'includeSaved',
	'includeStaged'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(ChangesetAttributes).filter(attribute => {
	return ChangesetAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_CHANGESET_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
