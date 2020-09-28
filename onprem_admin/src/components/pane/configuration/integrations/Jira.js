'use strict';

import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const JiraFormFieldSet = [
	[
		{
			id: 'jiraClientId',
			label: 'Client ID',
			width: 'col-10',
		},
		{
			id: 'jiraClientSecret',
			label: 'Secret',
			// mutedText: (
			// 	<a href={DocRefs.integrations.jira} target="_blank">
			// 		Documentation reference
			// 	</a>
			// ),
			width: 'col-10',
		},
	],
];

const JiraForm = props => {
	return <FormFieldSet fieldset={JiraFormFieldSet} helpDoc={DocRefs.integrations.jira} />;
};

export default JiraForm;
