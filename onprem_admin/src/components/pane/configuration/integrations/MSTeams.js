
import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const MSTeamsFormFieldSet = [
	[
		{
			id: 'mstAppClientId',
			label: 'App ID',
			mutedText: 'also known as the Client ID or Bot ID',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.msteams.cloud.appClientId',
			},
		},
		{
			id: 'mstAppClientSecret',
			label: 'Secret or Password',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 200,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.msteams.cloud.appClientSecret',
			},
		},
	],
];

const MSTeamsForm = props => {
	return (
		<FormFieldSet
			fieldset={MSTeamsFormFieldSet}
			formData={props.formData}
			helpDoc={DocRefs.integrations.msteams}
			dispatch={props.dispatch}
		/>
	);
};


const mapState = (state) => ({
	formData: {
		values: {
			mstAppClientId: state.config.integrations?.msteams?.cloud?.appClientId,
			mstAppClientSecret: state.config.integrations?.msteams?.cloud?.appClientSecret,
		},
		revertValues: {
			mstAppClientId: state.config.integrations?.msteams?.cloud?.appClientId,
			mstAppClientSecret: state.config.integrations?.msteams?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(MSTeamsForm);
