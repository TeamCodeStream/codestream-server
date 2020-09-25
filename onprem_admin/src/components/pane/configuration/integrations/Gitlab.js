
import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const GitlabFormFieldSet = [
	[
		{
			id: 'gitlabAppId',
			label: 'Application ID',
			width: 'col-10',
		},
		{
			id: 'gitlabSecret',
			label: 'Secret',
			mutedText: (
				<a href={DocRefs.integrations.gitlab} target="_blank">
					Documentation reference
				</a>
			),
			width: 'col-10',
		},
	],
];

const GitlabForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={GitlabFormFieldSet} />
		</form>
	);
};

export default GitlabForm;
