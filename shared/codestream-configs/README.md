# CodeStream Configuration Templates

## Overview
A **config parameter schema file** and profiles for maintaining and deploying
usable codestream configuration files.

## Notes
- Intended to be used as a git submodule so use **develop** branch for everything.
- The config parameter definition file, **parameters.json**, defines all
  configuration parameters and the structure of the configuration file.
  The `'desc'` property is the only required property for all parameters.
- **profiles/\*.json** define configuration profiles (codestream cloud
  environments, single host docker preview, mac development using pubnub,
  mac development using broadcaster, etc...)
- [README.parameter-definitions.json](README.parameter-definitions.json) - parameter descriptions
- [README.parameter-environment-overrides.json](README.parameter-environment-overrides.json) - environment variables used to override config file values
- Run `bin/update-all-configs` to refresh all config files as well as the parameter descriptions and environment overrides.
