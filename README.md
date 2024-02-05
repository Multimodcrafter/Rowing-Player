# Rowing Player
This is a PWA implementation of a music player using WebAudio.
It is designed to play music files in succession without any noticable pauses in between and presents information to the user, which aims to aid in the leading of indoor rowing classes.

You can use/install the player from [here](https://n.ethz.ch/~haenniro).

## Features
- Display the current beat number to aid in synchronized rowing
- Display a special "intro countdown" to help starting the training session in precise synchronization with the music
- Display arbitrary custom time synchronized notes

## File format
The player accepts a zip file which must contain all music files and a single `training.json` file in the root of the zip.

The structure of the json file can be deduced from the example below.
- The `Name` of the training is displayed in the player.
- The `Path` of each song must be relative to the root of the zip.
- The `Name` of each song is displayed in the player while that song is playing.
- The `Tempo` field must match the bpm value of the song.
- The `Intro` specifies the count of beats from the start of the song until the training is supposed to start.
- Every instructions' `Text` is displayed as soon as the previous instruction has timed out (or as soon as the song starts for the first instruction) and times out after `Time` seconds measured from the beginning of the song.
- An empty instruction is not displayed and serves to offset the display of the following instruction.

```json
{
    "Name": "Example training",
    "Content": [
        {
            "Path": "song1.mp3",
            "Name": "Song 1 - 20 s/m",
            "Tempo": 80,
            "Intro": 32,
            "Instructions": [
                {
                    "Text": "Get ready :)",
                    "Time": 24
                },
                {
                    "Text": "Go go go!",
                    "Time": 32
                }
            ]
        },
        {
            "Path": "song2.mp3",
            "Name": "Song 2 - 22 s/m",
            "Tempo": 88,
            "Intro": 0,
            "Instructions": [
                {
                    "Text": "",
                    "Time": 50
                },
                {
                    "Text": "Almost there!",
                    "Time": 60
                }
            ]
        },
        {
            "Path": "song3.mp3",
            "Name": "Song 3 - Break",
            "Tempo": 88,
            "Intro": 0,
            "Instructions": [
                {
                    "Text": "Time for a break :)",
                    "Time": 45
                },
                {
                    "Text": "Now do some stretching!",
                    "Time": 55
                },
                {
                    "Text": "The end!",
                    "Time": 60
                }
            ]
        }
    ]
}
```