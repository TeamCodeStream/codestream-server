
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
			// mutedText: (
			// 	<a href={DocRefs.integrations.bitbucket} target="_blank">
			// 		Documentation reference
			// 	</a>
			// ),
			width: 'col-10',
		},
	],
];

const BitbucketForm = props => {
	return <FormFieldSet fieldset={BitbucketFormFieldSet} helpDoc={DocRefs.integrations.bitbucket} />;
};

export default BitbucketForm;
