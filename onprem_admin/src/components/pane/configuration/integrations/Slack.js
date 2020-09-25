
import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const SlackFormFieldSet = [
	[
		{
			id: 'slackAppId',
			label: 'App ID',
			width: 'col-10',
		},
	],
	[
		{
			id: 'slackClientId',
			label: 'Client ID',
			width: 'col-10',
		},
	],
	[
		{
			id: 'slackClientSecret',
			label: 'Client Secret',
			width: 'col-10',
		},
	],
	[
		{
			id: 'slackSigningSecret',
			label: 'Signing Secret',
			width: 'col-10',
			mutedText: (
				<a href={DocRefs.integrations.slack} target="_blank">
					Documentation reference
				</a>
			),
		},
	],
];

const SlackForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={SlackFormFieldSet} />
		</form>
	);
};

export default SlackForm;
