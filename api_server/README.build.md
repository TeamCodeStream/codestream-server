# API Server Build Information

TeamCity Project: [API](http://tc.codestream.us/project/Api)

## GitFlow and Brief Overview
Read the [Build Overview](https://teamcodestream.atlassian.net/wiki/x/04BID) page on the Ops Wiki site.

## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| tgz | tarball of repo following an **npm install** |

| Asset Env | Asset | Location |
| --- | --- | --- |
| dev | tgz | [Asset server (dev/api-server)](http://assets.codestream.us/artifacts/dev/api-server/) |
| prod | tgz | [Asset server (prod/api-server)](http://assets.codestream.us/artifacts/prod/api-server/) |
| onprem | docker image | Published to docker hub as [teamcodestream/api-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/api-onprem) |

## Builds

[see standard builds](https://github.com/TeamCodeStream/teamcity_tools/blob/master/README.project-build-types.md#standard-project-builds)
