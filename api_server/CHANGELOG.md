# Change Log

## [8.0.3] - 2020-6-29

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
