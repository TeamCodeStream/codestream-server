'use strict';

import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const SendGridFormFieldSet = [
	[
		{
			id: 'sendGridApiKey',
			label: 'Version 3 API Key',
			width: 'col-10',
			mutedText: (
				<a href={DocRefs.mailout} target="_blank">
					Documentation reference
				</a>
			),
		},
	],
];

const SendGridForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={SendGridFormFieldSet} />
		</form>
	);
};

export default SendGridForm;
