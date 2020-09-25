
import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const MSTeamsFormFieldSet = [
	[
		{
			id: 'msTeamsAppId',
			label: 'App ID',
			mutedText: 'also known as the Client ID or Bot ID',
			width: 'col-10',
		},
		{
			id: 'msTeamsSecret',
			label: 'Secret or Password',
			width: 'col-10',
			mutedText: (
				<a href={DocRefs.integrations.msteams} target="_blank">
					Documentation reference
				</a>
			),
		},
	],
];

const MSTeamsForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={MSTeamsFormFieldSet} />
		</form>
	);
};

export default MSTeamsForm;
