// Copyright 2017 the original author or authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
let Assistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

// [START RippedEar]
const RANDOM_INTERVAL_ACTION = 'random_interval';
const VALIDATE_INTERVAL_ACTION = 'validate_interval';

const INSTRUCTED_ABOUT_PRACTICE_CONTEXT = 'instructed-about-practice';
const INTERVAL_PLAYED_CONTEXT = 'interval-played';

const ASC_DESC_HARM_ARG = 'asc_desc_harm';
const INTERVAL_ARG = 'interval';

const INTERVAL_RANGE = 13; // Generated intervals are from unison to octave inclusive
const INTERVAL_LOWER_BOUND = 55; // MIDI note number of lowest note to be played
const INTERVAL_UPPER_BOUND = 78; // MIDI note number of highest note to be played
const AUDIO_BASE_URL = 'https://storage.googleapis.com/musicnotes/';

const UNISON = 0;
const MINOR_SECOND = 1;
const MAJOR_SECOND = 2;
const MINOR_THIRD = 3;
const MAJOR_THIRD = 4;
const PERFECT_FOURTH = 5;
const TRITONE = 6;
const PERFECT_FIFTH = 7;
const MINOR_SIXTH = 8;
const MAJOR_SIXTH = 9;
const MINOR_SEVENTH = 10;
const MAJOR_SEVENTH = 11;
const OCTAVE = 12;


// Offset from filenames in sound files to MIDI values
// TODO: Renumber filenames to match MIDI numbers
const PITCH_OFFSET = 20;

// Holds the most recent interval played for comparison
var mostRecentIntervalSize = -1;
var mostRecentLowerPitchUrl = '';
var mostRecentUpperPitchUrl = '';

app.post('/', function (req, res) {
  const assistant = new Assistant({request: req, response: res});
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  // Generate a random interval
  function randomInterval (assistant) {
    // unison is 0 and octave is 12
    let intervalSize = Math.trunc(Math.random() * INTERVAL_RANGE);

    // store the inverval for when user attempts to name it
    mostRecentIntervalSize = intervalSize;

    let intervalLowerPitch = Math.trunc(Math.random() * (INTERVAL_UPPER_BOUND - INTERVAL_LOWER_BOUND - intervalSize + 1)) +
        INTERVAL_LOWER_BOUND;

    let intervalUpperPitch = intervalLowerPitch + intervalSize;

    let lowerPitchUrl = AUDIO_BASE_URL + (intervalLowerPitch - PITCH_OFFSET) + '.wav';
    mostRecentLowerPitchUrl = lowerPitchUrl;

    let upperPitchUrl = AUDIO_BASE_URL + (intervalUpperPitch - PITCH_OFFSET) + '.wav';
    mostRecentUpperPitchUrl = upperPitchUrl;

    let asc_desc_harm = assistant.getArgument(ASC_DESC_HARM_ARG);
    console.log('asc_desc_harm: ' + asc_desc_harm);
    assistant.setContext(INTERVAL_PLAYED_CONTEXT);
    assistant.ask('<speak>Here is the interval <audio src=\'' +  lowerPitchUrl + '\'/><audio src=\'' +
        upperPitchUrl + '\'/></speak>', ['Please say the interval you heard']);
    //assistant.ask('<speak>Here is the interval <audio src=\'' +  lowerPitchUrl + '\'/><audio src=\'' +
    //    upperPitchUrl + '\'/></speak>');
  }

  // Validate that the user said the correct random interval
  function validateInterval (assistant) {
    let interval = assistant.getArgument(INTERVAL_ARG);
    console.log('interval: ' + interval);

    if ((interval.toLowerCase() === 'unison' && mostRecentIntervalSize == UNISON) ||
        (interval.toLowerCase() === 'minor second' && mostRecentIntervalSize == MINOR_SECOND) ||
        (interval.toLowerCase() === 'major second' && mostRecentIntervalSize == MAJOR_SECOND) ||
        (interval.toLowerCase() === 'minor third' && mostRecentIntervalSize == MINOR_THIRD) ||
        (interval.toLowerCase() === 'major third' && mostRecentIntervalSize == MAJOR_THIRD) ||
        (interval.toLowerCase() === 'perfect fourth' && mostRecentIntervalSize == PERFECT_FOURTH) ||
        (interval.toLowerCase() === 'tritone' && mostRecentIntervalSize == TRITONE) ||
        (interval.toLowerCase() === 'perfect fifth' && mostRecentIntervalSize == PERFECT_FIFTH) ||
        (interval.toLowerCase() === 'minor sixth' && mostRecentIntervalSize == MINOR_SIXTH) ||
        (interval.toLowerCase() === 'major sixth' && mostRecentIntervalSize == MAJOR_SIXTH) ||
        (interval.toLowerCase() === 'minor seventh' && mostRecentIntervalSize == MINOR_SEVENTH) ||
        (interval.toLowerCase() === 'major seventh' && mostRecentIntervalSize == MAJOR_SEVENTH) ||
        (interval.toLowerCase() === 'octave' && mostRecentIntervalSize == OCTAVE)) {
      assistant.setContext(INSTRUCTED_ABOUT_PRACTICE_CONTEXT);
      assistant.ask('<speak>You are correct, the interval is a ' + interval + '.  Ready for another one?</speak>',
          ['Are you ready for another interval?']);

    }
    else {
      assistant.setContext(INTERVAL_PLAYED_CONTEXT);
      assistant.ask('<speak>Sorry, but that is incorrect.  Here is the interval again <audio src=\'' + mostRecentLowerPitchUrl + '\'/><audio src=\'' +
          mostRecentUpperPitchUrl + '\'/></speak>', ['Please tell me the interval you heard']);
    }
  }

  let actionMap = new Map();
  actionMap.set(RANDOM_INTERVAL_ACTION, randomInterval);
  actionMap.set(VALIDATE_INTERVAL_ACTION, validateInterval);

  assistant.handleRequest(actionMap);
});
// [END RippedEar]

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('App listening on port %s', port);
  });
  // [END server]
}

module.exports = app;
