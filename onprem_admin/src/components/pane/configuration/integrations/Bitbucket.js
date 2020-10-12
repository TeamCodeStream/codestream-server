import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const BitbucketFormFieldSet = [
	[
		{
			id: 'bitbucketAppClientId',
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
				property: 'integrations.bitbucket.cloud.appClientId',
			},
		},
		{
			id: 'bitbucketAppClientSecret',
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
				property: 'integrations.bitbucket.cloud.appClientSecret',
			},
		},
	],
];

const BitbucketForm = (props) => {
	return <FormFieldSet fieldset={BitbucketFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.bitbucket} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			bitbucketAppClientId: state.config.integrations?.bitbucket?.cloud?.appClientId,
			bitbucketAppClientSecret: state.config.integrations?.bitbucket?.cloud?.appClientSecret,
		},
		revertValues: {
			bitbucketAppClientId: state.config.integrations?.bitbucket?.cloud?.appClientId,
			bitbucketAppClientSecret: state.config.integrations?.bitbucket?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(BitbucketForm);
