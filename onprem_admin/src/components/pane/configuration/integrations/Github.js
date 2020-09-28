'use strict';

import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const GithubFormFieldSet = [
	[
		{
			id: 'githubClientId',
			label: 'Client ID',
			width: 'col-10',
		},
		{
			id: 'githubClientSecret',
			label: 'Client Secret',
			// mutedText: (
			// 	<a href={DocRefs.integrations.github} target="_blank">
			// 		Documentation reference
			// 	</a>
			// ),
			width: 'col-10',
		},
	],
];

const GithubForm = props => {
	return <FormFieldSet fieldset={GithubFormFieldSet} helpDoc={DocRefs.integrations.github} />;
};

export default GithubForm;
