
import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const BitbucketFormFieldSet = [
	[
		{
			id: 'bitbucketKey',
			label: 'Key',
			width: 'col-10',
		},
		{
			id: 'bitbucketSecret',
			label: 'Secret',
			mutedText: (
				<a href={DocRefs.integrations.bitbucket} target="_blank">
					Documentation reference
				</a>
			),
			width: 'col-10',
		},
	],
];

const BitbucketForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={BitbucketFormFieldSet} />
		</form>
	);
};

export default BitbucketForm;
