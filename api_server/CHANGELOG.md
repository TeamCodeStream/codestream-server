# Change Log

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
