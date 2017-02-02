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

const RANDOM_TRIAD_ACTION = 'random_triad';
const VALIDATE_TRIAD_ACTION = 'validate_triad';
const INSTRUCTED_ABOUT_TRIAD_PRACTICE_CONTEXT = 'instructed-about-triad-practice';
const TRIAD_PLAYED_CONTEXT = 'triad-played';

const ASC_DESC_HARM_ARG = 'asc_desc_harm';
const INTERVAL_ARG = 'interval';

const INTERVAL_RANGE = 13; // Generated intervals are from unison to octave inclusive
const PITCH_LOWER_BOUND = 55; // MIDI note number of lowest note to be played
const PITCH_UPPER_BOUND = 78; // MIDI note number of highest note to be played
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

const NUM_TRIAD_QUALITIES = 2;
const QUALITY_MAJOR = 0;
const QUALITY_MINOR = 1;
const QUALITY_DIMINISHED = 2;
const QUALITY_AUGMENTED = 3;

const NUM_TRIAD_INVERSIONS = 3;
const ROOT_POSITION = 0;
const FIRST_INVERSION = 1;
const SECOND_INVERSION = 2;

const TRIAD_QUALITY_ARG = 'quality';
const TRIAD_INVERSION_ARG = 'inversion';

const NUM_ATTEMPTS_ALLOWED = 3;


// Offset from filenames in sound files to MIDI values
// TODO: Renumber filenames to match MIDI numbers
const PITCH_OFFSET = 20;


app.post('/', function (req, res) {
  const assistant = new Assistant({request: req, response: res});
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  // Holds the most recent interval played for comparison
  assistant.data.mostRecentIntervalSize = -1;
  assistant.data.mostRecentLowerPitchUrl = '';
  assistant.data.mostRecentUpperPitchUrl = '';
  assistant.data.desc = false;

  // =========== INTERVAL-RELATED CODE ==========

  // Generate a random interval
  function randomInterval (assistant) {
    // unison is 0 and octave is 12
    let intervalSize = Math.trunc(Math.random() * INTERVAL_RANGE);

    // store the inverval for when user attempts to name it
    assistant.data.mostRecentIntervalSize = intervalSize;
    console.log("mostRecentIntervalSize: " + assistant.data.mostRecentIntervalSize);
    let intervalLowerPitch = Math.trunc(Math.random() * (PITCH_UPPER_BOUND - PITCH_LOWER_BOUND - intervalSize + 1)) +
        PITCH_LOWER_BOUND;

    let intervalUpperPitch = intervalLowerPitch + intervalSize;

    let lowerPitchUrl = AUDIO_BASE_URL + (intervalLowerPitch - PITCH_OFFSET) + '.wav';
    assistant.data.mostRecentLowerPitchUrl = lowerPitchUrl;
    console.log("mostRecentLowerPitchUrl: " + assistant.data.mostRecentLowerPitchUrl);

    let upperPitchUrl = AUDIO_BASE_URL + (intervalUpperPitch - PITCH_OFFSET) + '.wav';
    assistant.data.mostRecentUpperPitchUrl = upperPitchUrl;
    console.log("mostRecentUpperPitchUrl: " + assistant.data.mostRecentUpperPitchUrl);

    let asc_desc_harm = assistant.getArgument(ASC_DESC_HARM_ARG);
    //console.log('asc_desc_harm: ' + asc_desc_harm);

    assistant.data.desc = Math.trunc(Math.random() * 2) == 1;

    assistant.data.numIncorrect = 0;

    assistant.setContext(INTERVAL_PLAYED_CONTEXT, 5);
    assistant.ask('<speak>Here is the interval <audio src=\'' +  (assistant.data.desc ? upperPitchUrl : lowerPitchUrl) + '\'/><audio src=\'' +
        (assistant.data.desc ? lowerPitchUrl : upperPitchUrl) + '\'/></speak>', ['Please say the interval you heard']);
  }

  // Validate that the user said the correct random interval
  function validateInterval (assistant) {
    let interval = assistant.getArgument(INTERVAL_ARG);
    console.log('interval: ' + interval);

    if ((interval.toLowerCase() === 'unison' && assistant.data.mostRecentIntervalSize == UNISON) ||
        (interval.toLowerCase() === 'minor second' && assistant.data.mostRecentIntervalSize == MINOR_SECOND) ||
        (interval.toLowerCase() === 'major second' && assistant.data.mostRecentIntervalSize == MAJOR_SECOND) ||
        (interval.toLowerCase() === 'minor third' && assistant.data.mostRecentIntervalSize == MINOR_THIRD) ||
        (interval.toLowerCase() === 'major third' && assistant.data.mostRecentIntervalSize == MAJOR_THIRD) ||
        (interval.toLowerCase() === 'perfect fourth' && assistant.data.mostRecentIntervalSize == PERFECT_FOURTH) ||
        (interval.toLowerCase() === 'tritone' && assistant.data.mostRecentIntervalSize == TRITONE) ||
        (interval.toLowerCase() === 'perfect fifth' && assistant.data.mostRecentIntervalSize == PERFECT_FIFTH) ||
        (interval.toLowerCase() === 'minor sixth' && assistant.data.mostRecentIntervalSize == MINOR_SIXTH) ||
        (interval.toLowerCase() === 'major sixth' && assistant.data.mostRecentIntervalSize == MAJOR_SIXTH) ||
        (interval.toLowerCase() === 'minor seventh' && assistant.data.mostRecentIntervalSize == MINOR_SEVENTH) ||
        (interval.toLowerCase() === 'major seventh' && assistant.data.mostRecentIntervalSize == MAJOR_SEVENTH) ||
        (interval.toLowerCase() === 'octave' && assistant.data.mostRecentIntervalSize == OCTAVE)) {

      let aOrAn = interval.toLowerCase() === 'octave' ? "an" : "a";
      assistant.setContext(INSTRUCTED_ABOUT_PRACTICE_CONTEXT, 5);
      assistant.ask('<speak>You are correct, the interval is ' + aOrAn + ' ' + interval + '.  Let me know when you\'re ready for another, or if that\'s enough for now.</speak>',
          ['Please let me know when you\'re ready for another interval, or if you\'ve had enough']);

    }
    else {
      assistant.data.numIncorrect ++;

      if (assistant.data.numIncorrect < NUM_ATTEMPTS_ALLOWED) {
        assistant.setContext(INTERVAL_PLAYED_CONTEXT, 5);
        assistant.ask('<speak>Sorry, but that is incorrect.  Here is the interval again <audio src=\'' + (assistant.data.desc ? assistant.data.mostRecentUpperPitchUrl : assistant.data.mostRecentLowerPitchUrl) + '\'/><audio src=\'' +
            (assistant.data.desc ? assistant.data.mostRecentLowerPitchUrl : assistant.data.mostRecentUpperPitchUrl)  + '\'/></speak>', ['Please tell me the interval you heard']);
      }
      else {
          let correctIntervalName = "unknown";
          switch (assistant.data.mostRecentIntervalSize) {
              case UNISON: correctIntervalName = 'unison'; break;
              case MINOR_SECOND: correctIntervalName = 'minor second'; break;
              case MAJOR_SECOND: correctIntervalName = 'major second'; break;
              case MINOR_THIRD: correctIntervalName = 'minor third'; break;
              case MAJOR_THIRD: correctIntervalName = 'major third'; break;
              case PERFECT_FOURTH: correctIntervalName = 'perfect fourth'; break;
              case TRITONE: correctIntervalName = 'tri-tone'; break;
              case PERFECT_FIFTH: correctIntervalName = 'perfect fifth'; break;
              case MINOR_SIXTH: correctIntervalName = 'minor sixth'; break;
              case MAJOR_SIXTH: correctIntervalName = 'major sixth'; break;
              case MINOR_SEVENTH: correctIntervalName = 'minor seventh'; break;
              case MAJOR_SEVENTH: correctIntervalName = 'major seventh'; break;
              case OCTAVE: correctIntervalName = 'octave'; break;
          }
        assistant.setContext(INSTRUCTED_ABOUT_PRACTICE_CONTEXT, 5);
        assistant.ask('<speak>Incorrect again. Please listen to the interval one more time and I\'ll tell you the answer <audio src=\'' + (assistant.data.desc ? assistant.data.mostRecentUpperPitchUrl : assistant.data.mostRecentLowerPitchUrl)  + '\'/><audio src=\'' +
            (assistant.data.desc ? assistant.data.mostRecentLowerPitchUrl : assistant.data.mostRecentUpperPitchUrl)  + '\'/> The interval is a ' + correctIntervalName + '.  Please let me know when you\'re ready for another interval, or if you\'ve had enough.</speak>');
      }
    }
  }

  // =========== TRIAD-RELATED CODE ==========

    // Holds the most recent triad played for comparison
    assistant.data.mostRecentTriadQuality = QUALITY_MAJOR;
    assistant.data.mostRecentTriadInversion = ROOT_POSITION;
    assistant.data.mostRecentTriadLowerPitchUrl = '';
    assistant.data.mostRecentTriadMiddlePitchUrl = '';
    assistant.data.mostRecentTriadUpperPitchUrl = '';

    // Generate a random triad
    function randomTriad (assistant) {
      // Triad qualities are represented by constant values 0 - 3
      let triadQuality = Math.trunc(Math.random() * NUM_TRIAD_QUALITIES);

      // Triad inversion are represented by constant values 0 - 2
      let triadInversion = Math.trunc(Math.random() * NUM_TRIAD_INVERSIONS);

      // store the triad for when user attempts to name it
      assistant.data.mostRecentTriadQuality = triadQuality;
      assistant.data.mostRecentTriadInversion = triadInversion;

      console.log("mostRecentTriadQuality: " + assistant.data.mostRecentTriadQuality);
      console.log("mostRecentTriadInversion: " + assistant.data.mostRecentTriadInversion);

      let middlePitchSemitoneOffset = 0;
      let upperPitchSemitoneOffset = 0;

      if (triadQuality == QUALITY_MAJOR) {
          if (triadInversion == ROOT_POSITION) {
              middlePitchSemitoneOffset = 4;
              upperPitchSemitoneOffset = 7;
          }
          else if (triadInversion == FIRST_INVERSION) {
              middlePitchSemitoneOffset = 3;
              upperPitchSemitoneOffset = 8;
          }
          else if (triadInversion == SECOND_INVERSION) {
              middlePitchSemitoneOffset = 5;
              upperPitchSemitoneOffset = 9;
          }
      }
      else if (triadQuality == QUALITY_MINOR) {
          if (triadInversion == ROOT_POSITION) {
              middlePitchSemitoneOffset = 3;
              upperPitchSemitoneOffset = 7;
          }
          else if (triadInversion == FIRST_INVERSION) {
              middlePitchSemitoneOffset = 4;
              upperPitchSemitoneOffset = 9;
          }
          else if (triadInversion == SECOND_INVERSION) {
              middlePitchSemitoneOffset = 4;
              upperPitchSemitoneOffset = 8;
          }
      }
      else if (triadQuality == QUALITY_DIMINISHED) {
          if (triadInversion == ROOT_POSITION) {
              middlePitchSemitoneOffset = 3;
              upperPitchSemitoneOffset = 6;
          }
          else if (triadInversion == FIRST_INVERSION) {
              middlePitchSemitoneOffset = 3;
              upperPitchSemitoneOffset = 9;
          }
          else if (triadInversion == SECOND_INVERSION) {
              middlePitchSemitoneOffset = 6;
              upperPitchSemitoneOffset = 9;
          }
      }
      else if (triadQuality == QUALITY_AUGMENTED) {
          middlePitchSemitoneOffset = 4;
          upperPitchSemitoneOffset = 8;
      }

      let triadLowerPitch = Math.trunc(Math.random() * (PITCH_UPPER_BOUND - PITCH_LOWER_BOUND - upperPitchSemitoneOffset + 1)) +
            PITCH_LOWER_BOUND;

      let triadMiddlePitch = triadLowerPitch + middlePitchSemitoneOffset;
      let triadUpperPitch = triadLowerPitch + upperPitchSemitoneOffset;

      let triadLowerPitchUrl = AUDIO_BASE_URL + (triadLowerPitch - PITCH_OFFSET) + '.wav';
      assistant.data.mostRecentTriadLowerPitchUrl = triadLowerPitchUrl;
      console.log("mostRecentTriadLowerPitchUrl: " + assistant.data.mostRecentTriadLowerPitchUrl);

      let triadMiddlePitchUrl = AUDIO_BASE_URL + (triadMiddlePitch - PITCH_OFFSET) + '.wav';
      assistant.data.mostRecentTriadMiddlePitchUrl = triadMiddlePitchUrl;
      console.log("mostRecentTriadMiddlePitchUrl: " + assistant.data.mostRecentTriadMiddlePitchUrl);

      let triadUpperPitchUrl = AUDIO_BASE_URL + (triadUpperPitch - PITCH_OFFSET) + '.wav';
      assistant.data.mostRecentTriadUpperPitchUrl = triadUpperPitchUrl;
      console.log("mostRecentTriadUpperPitchUrl: " + assistant.data.mostRecentTriadUpperPitchUrl);

      assistant.data.numIncorrect = 0;

      assistant.setContext(TRIAD_PLAYED_CONTEXT, 5);
      assistant.ask('<speak>Here is the triad <audio src=\'' +  triadLowerPitchUrl + '\'/><audio src=\'' +
          triadMiddlePitchUrl + '\'/><audio src=\'' +
          triadUpperPitchUrl + '\'/></speak>', ['Please say the triad quality, and inversion, that you heard']);

        /*
         assistant.ask('<speak>Here is the interval <audio src=\'' +  (assistant.data.desc ? upperPitchUrl : lowerPitchUrl) + '\'/><audio src=\'' +
         (assistant.data.desc ? lowerPitchUrl : upperPitchUrl) + '\'/></speak>', ['Please say the interval you heard']);

         */
    }

    // Validate that the user identified the correct quality and inversion of the random triad
    function validateTriad (assistant) {
        let triadQuality = assistant.getArgument(TRIAD_QUALITY_ARG);
        let triadInversion = assistant.getArgument(TRIAD_INVERSION_ARG);

        console.log('triadQuality: ' + triadQuality);
        console.log('triadInversion: ' + triadInversion);

        if (((triadQuality.toLowerCase() === 'major' && assistant.data.mostRecentTriadQuality == QUALITY_MAJOR) ||
             (triadQuality.toLowerCase() === 'minor' && assistant.data.mostRecentTriadQuality == QUALITY_MINOR) ||
             (triadQuality.toLowerCase() === 'diminished' && assistant.data.mostRecentTriadQuality == QUALITY_DIMINISHED) ||
             (triadQuality.toLowerCase() === 'augmented' && assistant.data.mostRecentTriadQuality == QUALITY_AUGMENTED)) &&

            ((triadInversion.toLowerCase() === 'root position' && assistant.data.mostRecentTriadInversion == ROOT_POSITION) ||
             (triadInversion.toLowerCase() === 'first inversion' && assistant.data.mostRecentTriadInversion == FIRST_INVERSION) ||
             (triadInversion.toLowerCase() === 'second inversion' && assistant.data.mostRecentTriadInversion == SECOND_INVERSION))) {

                assistant.setContext(INSTRUCTED_ABOUT_TRIAD_PRACTICE_CONTEXT, 5);
                assistant.ask('<speak>You are correct, the triad is ' + triadQuality + ', in ' + triadInversion +
                    '.  Let me know when you\'re ready for another, or if that\'s enough for now.</speak>',
                    ['Please let me know when you\'re ready for another triad, or if you\'ve had enough']);
        }
        else {
            assistant.data.numIncorrect ++;

            if (assistant.data.numIncorrect < NUM_ATTEMPTS_ALLOWED) {
                assistant.setContext(TRIAD_PLAYED_CONTEXT, 5);
                assistant.ask('<speak>Sorry, but that is incorrect.  Here is the triad again <audio src=\'' +
                    assistant.data.mostRecentTriadLowerPitchUrl + '\'/><audio src=\'' +
                    assistant.data.mostRecentTriadMiddlePitchUrl + '\'/><audio src=\'' +
                    assistant.data.mostRecentTriadUpperPitchUrl + '\'/></speak>', ['Please tell me the triad quality, and inversion, that you heard']);
            }
            else {
                let correctTriadQuality = "unknown";
                let correctTriadInversion = "unknown";
                switch (assistant.data.mostRecentTriadQuality) {
                    case QUALITY_MAJOR: correctTriadQuality = 'major'; break;
                    case QUALITY_MINOR: correctTriadQuality = 'minor'; break;
                    case QUALITY_DIMINISHED: correctTriadQuality = 'diminished'; break;
                    case QUALITY_AUGMENTED: correctTriadQuality = 'augmented'; break;
                }
                switch (assistant.data.mostRecentTriadInversion) {
                    case ROOT_POSITION: correctTriadInversion = 'root position'; break;
                    case FIRST_INVERSION: correctTriadInversion = 'first inversion'; break;
                    case SECOND_INVERSION: correctTriadInversion = 'second inversion'; break;
                }
                assistant.setContext(INSTRUCTED_ABOUT_TRIAD_PRACTICE_CONTEXT, 5);
                assistant.ask('<speak>Incorrect again. Please listen to the triad one more time and I\'ll tell you the answer <audio src=\'' +
                    assistant.data.mostRecentTriadLowerPitchUrl + '\'/><audio src=\'' +
                    assistant.data.mostRecentTriadMiddlePitchUrl + '\'/><audio src=\'' +
                    assistant.data.mostRecentTriadUpperPitchUrl + '\'/> The triad is ' + correctTriadQuality + ', in ' +
                    correctTriadInversion + '.  Please let me know when you\'re ready for another triad, or if you\'ve had enough.</speak>');
            }
        }
    }

    let actionMap = new Map();
    actionMap.set(RANDOM_INTERVAL_ACTION, randomInterval);
    actionMap.set(VALIDATE_INTERVAL_ACTION, validateInterval);
    actionMap.set(RANDOM_TRIAD_ACTION, randomTriad);
    actionMap.set(VALIDATE_TRIAD_ACTION, validateTriad);

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
