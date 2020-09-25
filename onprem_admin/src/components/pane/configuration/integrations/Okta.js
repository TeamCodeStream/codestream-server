'use strict';

import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const OktaFormFieldSet = [
	[
		{
			id: 'oktaClientId',
			label: 'Client ID',
			width: 'col-10',
		},
		{
			id: 'oktaClientSecret',
			label: 'Client Secret',
			mutedText: (
				<a href={DocRefs.integrations.okta} target="_blank">
					Documentation reference
				</a>
			),
			width: 'col-10',
		},
	],
];

const OktaForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={OktaFormFieldSet} />
		</form>
	);
};

export default OktaForm;
