# Pubnub Integration

CodeStream uses the [Pubnub](https://pubnub.com) service for real-time broadcast
message.

Ideally, each CodeStream environment should use its own set of pubnub keys to
guard against any cross-contamination but this is not absolutely required.

When generating a new keyset, apply the following Configuration settings to it.

* Presence: On
    - Announce Max: 100
    - Interval: 10
    - Presence Deltas: yes
    - Generate Leave on TCP FIN or RST: no
    - Stream Filtering: yes
    - Debounce: 2
    - leave all other fields blank

* Storage & Playback: On
    - Retention: 30 day
    - leave all other fields blank

* Access Manager: On

Leave all other configuration sections Off.
