
import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const AzureDevOpsFormFieldSet = [
	[
		{
			id: 'devopsAppId',
			label: 'App ID',
			width: 'col-10',
		},
		{
			id: 'devopsSecret',
			label: 'Client Secret',
			mutedText: (
				<p>Careful not to mistake Client Secret for App Secret.
					<a href={DocRefs.integrations.devops} target="_blank">
						Documentation reference
					</a>
				</p>
			),
			width: 'col-10',
		},
	],
];

const AzureDevOpsForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={AzureDevOpsFormFieldSet} />
		</form>
	);
};

export default AzureDevOpsForm;
