
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
			mutedText: <p className="mb-0">Careful not to mistake Client Secret for App Secret.</p>,
			width: 'col-10',
		},
	],
];

const AzureDevOpsForm = props => {
	return <FormFieldSet fieldset={AzureDevOpsFormFieldSet} helpDoc={DocRefs.integrations.devops} />;
};

export default AzureDevOpsForm;
