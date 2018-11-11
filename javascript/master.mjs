'use strict';

import { chronos } from './chronos.mjs';
import { InitPixi , LoadTextures, Resize, app, view, renderer, settings, Graphics} from './graphics.mjs';
import { Timeline } from  './timeline.mjs';
import { interaction } from './interaction.mjs';
import {HandleStartJourney} from './journey.mjs';

MobileWarning();
InitPixi();
SayHello();
OpenExplanationModal();

let timeline = new Timeline();
interaction.start(timeline);

LoadJSON('data/events.json', data => {
  let events = JSON.parse(data);
  for (let event of events) {
    let name = event.name;
    let date = new chronos.Date(
      event.date[0], // year
      event.date.length >= 2 ? event.date[1] : 0, // month
      event.date.length >= 3 ? event.date[2] : 0); // day
    let wiki_ref = event.wiki;
    timeline.AddEvent(new chronos.Timepoint(name, date, wiki_ref));
  };
  timeline.LogTimepoints();
  timeline.FitBubbles();
  timeline.LoadTextures();
  HandleStartJourney(timeline);
});

$('.infobox-size-toggle').click(_ => {
  $('.infobox').toggleClass('infobox-extended');
});

//
// Test Animation
//
$('.bt-animtest').click(_ => {
  const zoom_inital = timeline.date_last.year - timeline.date_first.year;
  timeline.ScrollTo(new chronos.Date(-3300), 1500);
  timeline.ZoomTo(2000, 1500, _ => {
    timeline.ScrollTo(new chronos.Date(-2560), 900, _ => {
      timeline.ScrollTo(new chronos.Date(-1500), 3000);
      timeline.ZoomTo(7000, 3000, _ => {
        timeline.ZoomTo(100, 4000);
        timeline.ScrollTo(new chronos.Date(1945), 5000, _ => {
          timeline.ZoomTo(50, 800, _ => {
            timeline.ScrollTo(new chronos.Date(1969), 2500, _ => {
              timeline.ZoomTo(zoom_inital, 3000);
            });
          })
        });
      });
    })
  });
});

//
// Toggle Date
//
$('.onoffswitch-checkbox').click(_ => {
  const type_new = $('.date-type').text() == 'Holocene' ? 'Gregorian' : 'Holocene';
  $('.date-type').text(type_new);
  timeline.SetDateType(type_new);
  timeline.Resize();
})

//
// Show Info Button
//
$('.bt-showinfo').click(_ => OpenExplanationModal(false) );

//
// Display mobile warning
//
function MobileWarning() {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('body').append(`
      <div class="phoneblock">
        <p>This website doesn't support a mobile view yet.<p>
        <button id="bt-mobile-show">Show me anyway!</button>
      </div>
    `);
    $('#bt-mobile-show').click(_ => $('.phoneblock').css('display', 'none'));
  }
}

//
// Print greeting
//
function SayHello() {
  (today => console.log(`\n  ${ '\u{1F4C5} \u{1F5D3} '.repeat(7)}\u{1F4C5}\n\nToday is the
  ${today.gregorian.toString()} - that's the ${today.holocene.toString()} in the Holocene calendar.\n
  %c\u2796\u{1F54C}\u2796\u{1F53A}\u2796\u{1F5FF}\u2796\u{1F3DB}\u2796\u{1F3F0}\u2796\u{1F3ED}\u2796\u{1F680}\u2796\n`,
  'font-size: 20px'))(new chronos.Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
}

//
// Load JSON
//
function LoadJSON(file, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', file, true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

//
// open explanation modal
//
function OpenExplanationModal(pageLoad = true) {
  if (ShowExplanationPage() || !pageLoad) {
    //show modal
    $("#modal").css("display", "flex");
    $("#explanation-box").css("display", "flex");
    // register close event
  }
}

$("#close-explanation-box").click(function () {
  DontShowMeAgain();
  CloseExplanationModal();
})

//
// close explanation modal
//
function CloseExplanationModal() {
    $( "#explanation-box" ).fadeOut( "slow", function() {
      $("#modal").hide();
    });
}


//
// show explanation page or not
//
function ShowExplanationPage () {
  if(getCookie("no-explanation")) return false;
  return true
}

//
// dont show me again
//
function DontShowMeAgain () {
  if ($("#dont-show-me-again").prop( "checked" )) {
    // set cookie that you decided to hide the explanation page
    setCookie("no-explanation", 1);
  }
}


// Cookie functions
function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}
