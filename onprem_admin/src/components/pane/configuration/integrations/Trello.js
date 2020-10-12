'use strict';

import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const TrelloFormFieldSet = [
	[
		{
			id: 'trelloApiKey',
			label: 'API Key',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.trello.cloud.apiKey',
			},
		},
	],
];

const TrelloForm = (props) => {
	return <FormFieldSet fieldset={TrelloFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.trello} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			trelloApiKey: state.config.integrations?.trello?.cloud?.apiKey,
		},
		revertValues: {
			trelloApiKey: state.config.integrations?.trello?.cloud?.apiKey,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(TrelloForm);
