'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Accordion, { getAccordionCardStatuses } from '../../../lib/Accordion';
import SlackForm from './Slack';
import MSTeamsForm from './MSTeams';
import TrelloForm from './Trello';
import JiraForm from './Jira';
import GithubForm from './Github';
import BitbucketForm from './Bitbucket';
import GitlabForm from './Gitlab';
import DevopsForm from './Devops';
import OktaForm from './Okta';

import ConfigActions from '../../../../store/actions/config';
import { integrationStatuses, standardIntegrationStatus } from '../../../../store/actions/presentation';

// custom funcs return the status indicator for a card (disabled, on or off)
function slackIntegrationStatus(state) {
	const integration = state.config.integrations?.slack?.cloud;
	if (!integration || !(integration.appClientId && integration.appClientSecret && integration.appId && integration.appSigningSecret)) {
		return integrationStatuses.disabled;
	}
	return !integration.disabled ? integrationStatuses.on : integrationStatuses.off;
}

function trelloIntegrationStatus(state) {
	const integration = state.config.integrations?.trello?.cloud;
	if (!integration?.apiKey) {
		return integrationStatuses.disabled;
	}
	return !integration.disabled ? integrationStatuses.on : integrationStatuses.off;

}


const accordions = [
	{
		id: 'messagingAccordion',
		title: 'Messaging',
		desc: 'Two-way integrations with messaging services to extend discussions beyond CodeStream.',
		cards: [
			{
				id: 'intgrMsgSlack',
				header: 'Slack',
				bodyComponent: <SlackForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.slack.cloud.disabled',
					},
					getStatusFromState: slackIntegrationStatus,
				},
			},
			{
				id: 'intgrMSTeams',
				header: 'MS Teams',
				bodyComponent: <MSTeamsForm />,
				// bodyComponentProps: { param: '12345' },
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.msteams.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'msteams');
					},
				},
			},
		],
	},
	{
		id: 'issueTrackingAccordion',
		title: 'Issue Tracking',
		desc: 'Integrations with issue tracking services.',
		cards: [
			{
				id: 'intgrTrkGithub',
				header: 'Github',
				bodyComponent: <GithubForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.github.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'github');
					},
				},
			},
			{
				id: 'intgrTrkBitbucket',
				header: 'Bitbucket',
				bodyComponent: <BitbucketForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.bitbucket.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'bitbucket');
					},
				},
			},
			{
				id: 'intgrTrkTrello',
				header: 'Trello',
				bodyComponent: <TrelloForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.trello.cloud.disabled',
					},
					getStatusFromState: trelloIntegrationStatus,
				},
			},
			{
				id: 'intgrTrkJira',
				header: 'Jira Cloud',
				bodyComponent: <JiraForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.jira.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'jira');
					},
				},
			},
			{
				id: 'intgrTrkGitlab',
				header: 'Gitlab',
				bodyComponent: <GitlabForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.gitlab.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'gitlab');
					},
				},
			},
			{
				id: 'intgrTrkDevops',
				header: 'Azure Dev Ops',
				bodyComponent: <DevopsForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.devops.cloud.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'devops');
					},
				},
			},
			{
				id: 'intgrTrkOkta',
				header: 'Okta',
				bodyComponent: <OktaForm />,
				statusSwitch: {
					onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
					onClickActionPayload: {
						property: 'integrations.okta.localInstallation.disabled',
					},
					getStatusFromState: (state) => {
						return standardIntegrationStatus(state, 'okta', 'localInstallation');
					},
				},
			},
		],
	},
];

const accordionCardsById = {
	messagingAccordion: accordions[0].cards,
	issueTrackingAccordion: accordions[1].cards,
};


class Integrations extends React.Component {
	render() {
		return (
			<article className="Integrations layout-integrations container-fluid col-8">
				{accordions.map((a) => {
					return (
						<div key={a.id}>
							<h5>{a.title}</h5>
							{/* <p>{a.desc}</p> */}
							<Accordion
								accordionId={a.id}
								message={a.desc}
								cards={a.cards}
								statuses={this.props[a.id].statuses}
								dispatch={this.props.dispatch}
							/>
						</div>
					);
				})}
			</article>
		);
	}
}

const mapState = (state) => ({
	messagingAccordion: {
		statuses: getAccordionCardStatuses(state, accordionCardsById.messagingAccordion),
	},
	issueTrackingAccordion: {
		statuses: getAccordionCardStatuses(state, accordionCardsById.issueTrackingAccordion),
	},
});

const mapDispatch = dispatch => ({
	dispatch
});

export default connect(mapState, mapDispatch)(Integrations);
