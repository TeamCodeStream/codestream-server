'use strict';

import React from 'react';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

const TrelloFormFieldSet = [
	[
		{
			id: 'trelloApiKey',
			label: 'App Key',
			mutedText: (
				<a href={DocRefs.integrations.trello} target="_blank">
					Documentation reference
				</a>
			),
			width: 'col-10',
		},
	],
];

const TrelloForm = props => {
	return (
		<form className="form">
			<FormFieldSet fieldset={TrelloFormFieldSet} />
		</form>
	);
};

export default TrelloForm;
