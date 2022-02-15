# Change Log

## [12.0.4] - 2022-2-16

### Changed

- Remove Team section of weekly activity emails when org has more than 25 members
- After signing in on the web, user is now brought to the given codemark/feedback request/permalink when appropriate

## [12.0.3] - 2022-2-5

### Changed

- Replace video on open-in-IDE redirect page from New Relic with animated gif

## [12.0.2] - 2022-1-31

### Changed

- Stop trying to auto-redirect users into VS Code when opening an error from New Relic

## [12.0.1] - 2022-1-25

### Fixed

- Fixes an issue connecting to New Relic after signing up with a New Relic api key

## [12.0.0] - 2022-1-24

### Fixed

- Fixes an issue preventing authentication via GitHub

## [11.0.29] - 2022-1-24

### Added

- Adds backend support for being able to sign into CodeStream with a code sent via email
- Adds backend support for being able to sign up for CodeStream with a New Relic One user api key

## [11.0.28] - 2022-1-4

### Changed

- Updated UI for web page that redirects users from New Relic into the IDE
- Prevent access to error groups that the user's api key doesn't have access to 
- Attempt to automatically redirect user to VS Code when doing an Open-in-IDE

### Fixed

- Fixes an issue creating a PR across forks when there are a larger number of forks

## [11.0.27] - 2021-12-22

### Changed

- Telemetry update for the open-in-IDE redirect page 

## [11.0.26] - 2021-12-21

### Changed

- Security work around access to error groups 

## [11.0.25] - 2021-12-13

### Changed

- Better telemetry from apiweb to the extension

## [11.0.24] - 2021-11-30

### Fixed

- Fixes an issue with public primary email not always being sent over from GitLab and preventing signup

## [11.0.23] - 2021-11-23

### Changed

- Always show IDE-specific instructions on redirect web page

## [11.0.22] - 2021-11-15

### Changed

- Improved UX when redirecting New Relic users into IDE from an error

## [11.0.21] - 2021-11-5

### Fixed

- Fixes an issue with replies from Slack

## [11.0.20] - 2021-11-4

### Fixed

- Fixes an issue with domain-based joining after authenticating via a code host

## [11.0.18] - 2021-10-21

### Fixed

- Fixes a post fetching issue

## [11.0.17] - 2021-10-20

### Added

- Backend support for new integration

## [11.0.16] - 2021-10-19

### Added

- Backend support for new integration

## [11.0.15] - 2021-10-7

### Changed

- Fixes an issue where users couldn't create an organization

## [11.0.14] - 2021-10-7

### Changed

- Set minimum required version of the CodeStream extensions to 11.1.0

## [11.0.13] - 2021-10-7

### Changed

- Backend changes for making CodeStream organization-centric

## [11.0.12] - 2021-9-18

### Changed

- Backend changes for EAP

## [11.0.11] - 2021-8-29

### Changed

- Set minimum required version of the JetBrains extension to 11.0.13

## [11.0.10] - 2021-8-27

### Changed

- Set minimum required versions of the VS and VS Code extensions to 11.0.14

## [11.0.9] - 2021-8-24

### Fixed

- Fixes an issue with the Sendgrid to Segment script

## [11.0.8] - 2021-7-7

### Changed

- Force update of the JetBrains extension

## [11.0.7] - 2021-7-1

### Changed

- Rolled back forced update of JetBrains extension

## [11.0.6] - 2021-7-1

### Changed

- Removed references to Atom extension on apiweb pages

## [11.0.5] - 2021-6-22

### Changed

- Release bump to support changes to outbound email

## [11.0.3] - 2021-6-7

### Changed

- Backend support for new terms-of-service acceptance flow

## [11.0.2] - 2021-5-18

### Changed

- Special encode Jira host during OAuth 1.0 dance to avoid potential bogus decodings

## [11.0.1] - 2021-5-13

### Fixed 

- Fix low-level mongo race condition bug concerning marker locations

## [11.0.0] - 2021-5-6

### Added 

- Provide feedback in UI for on-prem customers when the api server can't communicate with the broadcaster

## [8.2.39] - 2021-4-30

### Fixed 

- Addresses [#525](https://github.com/TeamCodeStream/CodeStream/issues/525) &mdash; Error creating a codemark in a file with a lot of uncommitted changes

## [8.2.38] - 2021-4-28

### Fixed 

- Fixes an issue with the broadcaster connection
- Fixes an issue with large change sets in a feedback request not being saved to the database

## [8.2.37] - 2021-4-22

### Changed 

- Increased efficiency of real-time messaging services
- Backend work to support team switching when you click on a permalink for an item owned by a team other than the one you currently have selected

## [8.2.36] - 2021-4-6

### Changed 

- Eliminates check for username uniqueness at registration since it's really a display name
- Improves logic for determining on-prem vs cloud

## [8.2.35] - 2021-3-26

### Fixed

- Fixes a memory leak issue with feedback request reminder emails

## [8.2.34] - 2021-3-22

### Added

- Temporarily turn off feedback request reminder emails

## [8.2.33] - 2021-3-17

### Added

- Add backend support for displaying unread message indicators (i.e., blue badges) in the various section of the CodeStream pane

## [8.2.32] - 2021-3-12

### Added

- Basic CMS support for weekly email

## [8.2.31] - 2021-3-10

### Added

- Weekly email improvements

## [8.2.30] - 2021-3-9

### Added

- Adds backend support for prompting you to review a teammate's commits when you pull

## [8.2.29] - 2021-3-8

### Added

- Adds backend support for displaying unread message indicators in sections of the CodeStream pane

### Fixed

- Fixes [#419](https://github.com/TeamCodeStream/codestream/issues/419) &mdash; Extraneous } at the end of code block in Slack reply form

## [8.2.28] - 2021-3-7

### Fixed

- Deployment discrepancy

## [8.2.26] - 2021-3-5

### Fixed

- Fixes an issue with signing up with a username that was previously deactivated on the same team

## [8.2.25] - 2021-2-17

### Added

- Backend support for updating codemark or feedback request resolution status on Slack

## [8.2.24] - 2021-2-10

### Fixed

- Fixes an issue preventing Jira cloud from being listed on the Integrations page for on-prem customers

## [8.2.23] - 2021-2-9

### Added

- Security improvements

## [8.2.22] - 2021-2-2

### Added

- Adds a new one-time email/toast notification when you have an open feedback request assigned to you that hasn't had activity in 24 hours
- Adds new reminder invitations for teammates that haven't yet joined CodeStream

### Changed

- New subject for initial feedback request notifications going to unregistered users
- Suppressed "Open in IDE" buttons in email notifications to unregistered users

### Fixed

- Fixes an issue with commenting on code where the git blame returns an author with no email address

## [8.2.21] - 2021-1-26

### Added

- Additional changes to support the GitLens integration

## [8.2.20] - 2021-1-25

### Added

- Backend support for deeper GitLens integration

### Changed

- Changed subject of invitation email

## [8.2.19] - 2021-1-20

### Fixed

- add uploadEngine.s3.stripKeyPrefixFromUrl property for serving file uploads via Cloud Front

## [8.2.18] - 2021-1-19

### Fixed

- Minor bug fixes and improvements

## [8.2.17] - 2021-1-13

### Fixed

- Fixes [#41](https://github.com/TeamCodeStream/codestream-server/issues/41) &mdash; Cannot send email using generic STMP

## [8.2.16] - 2021-1-8

### Added

- Adds backend support for the new integration with Linear

## [8.2.15] - 2020-12-22

### Changed

- Update to use V2 OAuth 2.0 flow for Slack authentication

## [8.2.14] - 2020-12-17

### Changed

- Update to repo-matching logic for new repo-based joining feature

## [8.2.13] - 2020-12-17

### Added

- Adds backend support for people joining teams based on repository access
- Adds backend support for admins restricting available integrations and authentication options

### Fixed

- Fixes an issue with the refreshing of Bitbucket tokens

## [8.2.12] - 2020-12-4

### Added

- Adds backend support for letting users know (via banner in the client) that there is a problem with their GitHub connection.

## [8.2.11] - 2020-11-24

### Changed

- Backout change to Slack OAuth v2.

## [8.2.10] - 2020-11-24

### Added

- Adds backend support for the new Clubhouse integration

### Changed

- Migrate to Slack OAuth v2.

### Fixed

- Fixes an issue where buttons to sign in with GitLab and Bitbucket were missing from the web login form

## [8.2.9] - 2020-11-13

### Changed

- Backend work to make the "Work in Progress" section of the CodeStream pane more performant, with reduced api requests

## [8.2.8] - 2020-11-5

### Fixed

- Fixes an issue where Bitbucket Server was incorrectly listed as an issue-tracking service

## [8.2.7] - 2020-10-28

### Changed

- Eliminated skip-the-trial discount on payment page based on new pricing model
- Backend support for adding or removing a range from a codemark
- Backend support for new GitHub authentication flow in VS Code extension

## [8.2.6] - 2020-9-29

### Fixed

- OnPrem quickstart configuration not loading properly

## [8.2.5] - 2020-9-26

### Changed

- All new teams created on CodeStream are now automatically placed on the Free Plan.

## [8.2.4] - 2020-9-16

### Added

- Adds new `notifications` scope to the GitHub Enterprise instructions to accomodate the pull-request integration

## [8.2.3] - 2020-8-27

### Changed

- Automatically strip trailing spaces off of email addresses

### Fixed

- Fixes an issue with incorrect scopes with the CodeStream Slack app

## [8.2.2] - 2020-8-19

### Fixed

- Fixes an issue with PubNub not generating real-time notifications for very large code reviews

## [8.2.1] - 2020-8-14

### Added

- Adds new `notifications` scope for GitHub auth to accomodate upcoming pull-request integration

## [8.2.0] - 2020-8-3

### Added

- Adds support for authenticating with GitLab or Bitbucket
- Adds backend support for non-admin team members to map their Git email address to their CodeStream email address

## [8.1.0] - 2020-7-21

### Added

- Adds support for self-serve payments when subscribing to CodeStream

## [8.0.7] - 2020-7-16

### Fixed

- Implements a workaround for [double-pasting issue](https://github.com/microsoft/vscode/issues/101946) in VS Code Insiders

## [8.0.6] - 2020-7-9

### Added

- Adds support for connecting to Bitbucket Server

## [8.0.5] - 2020-7-2

### Fixed

- Fixes an issue with Slack auth prematurely asking for the user.profile:write permission

## [8.0.4] - 2020-6-30

### Fixed

- Repaired mono-repo build artifact management

## [8.0.3] - 2020-6-30

### Added

- Adds a script for on-prem admins to set a temporary password for a user, which will also force the user to change it upon signin

## [8.0.2] - 2020-6-23

### Added

- Opens up new "Start Work" feature for all teams and all IDEs

## [8.0.1] - 2020-6-23

### Added

- Opens up new "Start Work" feature for select teams and all IDEs except JetBrains

## [8.0.0] - 2020-6-22

### Added

- Adds pullrequest:write scope for Bitbucket auth to support creation of a PR on Bitbucket

## [7.4.2] - 2020-6-19

### Added

- Adds support for forthcoming "Start Work" feature
- Adds support for forthcoming ability to create pull requests from CodeStream

## [7.4.1] - 2020-6-11

### Changed

- When an approved code review is amended, all aprovals are cleared

### Fixed

- Fixes an "Application Missing" error when setting up Jira Server integration

## [7.4.0] - 2020-6-8

### Added

- Adds support for a nightly phone-home for CodeStream On-Prem
- Adds support for assigning code reviews or mentioning people in codemarks that aren't yet on your CodeStream team

## [7.2.6] - 2020-5-28

### Changed

- Bump API server payload limit to 20MB

## [7.2.5] - 2020-5-21

### Added

- Adds support for authentication with Okta for CodeStream On-Prem installations

## [7.2.4] - 2020-5-15

### Changed

- Suppress button to sign in with Okta until feature is ready to launch

## [7.2.3] - 2020-5-14

### Added

- Adds support for automatically redirecting you to your IDE when clicking on a permalink or an "Open in IDE" button
- Adds backend support for authentication via Okta

### Fixed

- Fixes [#148](https://github.com/TeamCodeStream/CodeStream/issues/148) &mdash; Web dropdown menu is misaligned

## [7.2.2] - 2020-5-11

### Added

- Adds support for adding new changesets to a code review

## [7.2.1] - 2020-5-5

### Added

- Adds support for bypassing email confirmation if outbound email isn't configured in on-prem installation
- Adds support for additional copy on the Notifications page when outbound email isn't configured in on-prem installation
- Adds support for editing the approval policy for a code review

## [7.2.0] - 2020-4-24

### Added

- Adds support for multiple approvers per code review

### Fixed

- Fixes [#179](https://github.com/TeamCodeStream/CodeStream/issues/179) &mdash; Can't use GH auth in MS Teams signin flow

## [7.1.0] - 2020-4-20

### Added

- Adds support for new personal-access-token based GitHub Enterprise and GitLab Self-Managed integrations
- Adds support for deep linking to specific pages within the CodeStream extension
- Adds support for baking a CodeStream on-prem server URL into invitation codes

## [7.0.1] - 2020-4-10

### Added

- Adds support for users changing their own email addresses
- Adds support for users adding profile photos
- Adds support for new guided tour for new users

## [7.0.0] - 2020-4-3

### Changed

- Turns on code review functionality for all teams
- Minor change to logic for creating callback URLs in the API

### Fixed

- Fixes an issue with removed users being included in count of team members

## [6.4.3] - 2020-4-1

### Fixed

- Fixes an issue receiving real-time events for on-prem customers

## [6.4.2] - 2020-4-1

### Fixed

- Raises the page size on stream fetches to fix an issue with codemarks not rendering in spatial view

## [6.4.1] - 2020-3-31

### Added

- Adds support for signing into CodeStream with GitHub

## [6.4.0] - 2020-3-27

### Changed

- CodeStream On-Prem now no longer requires SSL certificates
