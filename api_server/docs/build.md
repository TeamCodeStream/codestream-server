# API Server Build Information

TeamCity Project: [API](http://redirector.codestream.us/builds/api)

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

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
