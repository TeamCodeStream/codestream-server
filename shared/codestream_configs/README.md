# CodeStream Configuration Templates

## Overview
A **config parameter definition file** and profiling system for maintaining
and deploying configuration files.  The unified configuration files are *not*
divorced entirely from the sandboxes. Some environment variables and run-time
environment features are needed.

## Notes
- Use **develop** branch for development
- Use **master** branch for qa & prod
- The config parameter definition file, **parameters.json**, defines all
  configuration parameters and the structure of the configuration file.
- **profiles/\*.json** define configuration profiles (codestream cloud
  environments, single host docker preview, mac development using pubnub,
  mac development using broadcaster, etc...)
- [README.parameter-definitions.json](README.parameter-definitions.json) (auto-generated with git hook).
