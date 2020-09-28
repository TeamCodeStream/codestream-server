'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Accordion from '../../../lib/Accordion';
import SlackForm from './Slack';
import MSTeamsForm from './MSTeams';
import TrelloForm from './Trello';
import JiraForm from './Jira';
import GithubForm from './Github';
import BitbucketForm from './Bitbucket';
import GitlabForm from './Gitlab';
import DevopsForm from './Devops';
import OktaForm from './Okta';

import { integrationStatuses, slackIntegrationStatus } from '../../../../store/actions/presentation';

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
			},
			{
				id: 'intgrMSTeams',
				header: 'MS Teams',
				bodyComponent: <MSTeamsForm />,
				// bodyComponentProps: { param: '12345' },
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
			},
			{
				id: 'intgrTrkBitbucket',
				header: 'Bitbucket',
				bodyComponent: <BitbucketForm />,
			},
			{
				id: 'intgrTrkTrello',
				header: 'Trello',
				bodyComponent: <TrelloForm />,
			},
			{
				id: 'intgrTrkJira',
				header: 'Jira Cloud',
				bodyComponent: <JiraForm />,
			},
			{
				id: 'intgrTrkGitlab',
				header: 'Gitlab',
				bodyComponent: <GitlabForm />,
			},
			{
				id: 'intgrTrkDevops',
				header: 'Azure Dev Ops',
				bodyComponent: <DevopsForm />,
			},
			{
				id: 'intgrTrkOkta',
				header: 'Okta',
				bodyComponent: <OktaForm />,
			},
		],
	},
];

class Integrations extends React.Component {
	// state = {};

	// lifecycle methods
	componentDidMount() {
		// dom has been mounted in browser successfully
		// ajax calls, set timers & listeners, etc...
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	render() {
		return (
			<article className="Integrations layout-integrations container-fluid col-8">
				{accordions.map((a) => {
					return (
						<div key={a.id}>
							<h5>{a.title}</h5>
							{/* <p>{a.desc}</p> */}
							<Accordion accordionId={a.id} message={a.desc} cards={a.cards} statuses={this.props.statuses}/>
						</div>
					);
				})}
			</article>
		);
	}
}

// return object for Accordion component status properties
function setIntegrationStatuses(state) {
	const integrationStatuses = {
		intgrMsgSlack: slackIntegrationStatus(state),
	};
	const integrationStatusData = {};
	for (const integrationId in integrationStatuses) {
		integrationStatusData[integrationId] = {};
		switch (integrationStatuses[integrationId]) {
			case integrationStatuses.on:
				// integrationStatusData[integrationId].badgeStatus = 'success';
				// integrationStatusData[integrationId].badgeValue = 'CONFIGURAED';
				integrationStatusData[integrationId].icon = '/s/fa/svgs/solid/toggle-on.svg.green.png';
				break;
			case integrationStatuses.off:
				// integrationStatusData[integrationId].badgeStatus = 'dark';
				// integrationStatusData[integrationId].badgeValue = 'UNCONFIGURAED';
				integrationStatusData[integrationId].icon = '/s/fa/svgs/solid/toggle-off.svg.on-white.png';
				break;
			default:	// integrationStatuses.disabled
				integrationStatusData[integrationId].icon = '/s/fa/svgs/solid/toggle-off.svg.grey2-8e8e8e.solid-back.png';
				break;
		}
	};
	return integrationStatusData;
};

const mapState = state => {
	console.debug('Integrations/mapState(integrations)', state.presentation.configuration.integrations);
	return {
		integrations: state.presentation.configuration.integrations,
		statuses: setIntegrationStatuses(state),
	};
};

const mapDispatch = dispatch => ({});

export default connect(mapState, mapDispatch)(Integrations);
