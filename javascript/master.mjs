'use strict';

import { chronos } from './chronos.mjs';
import { InitPixi , LoadTextures, Resize, app, view, renderer, settings, Graphics} from './graphics.mjs';
import { Timeline } from  './timeline.mjs';
import { interaction } from './interaction.mjs'

MobileWarning();
InitPixi();
SayHello();

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
    timeline.AddEvent(new chronos.Timepoint(name, date));
  };
  timeline.LogTimepoints();

});

//
// Test Animation
//
$('.bt-animtest').click(_ => {
  timeline.ZoomTo(5000, _ => {
    timeline.ScrollTo(new chronos.Date(-2560), _ => {
      timeline.ZoomTo(1000, _ => {
        timeline.ScrollTo(new chronos.Date(-1200), _=> {
          timeline.ZoomTo(200, _=> {
            timeline.ScrollTo(new chronos.Date(1900), _ => {
              timeline.ZoomTo(12018, ()=>{}, 3000);
            }, 10000);
          });
        }, 2000);
      });
    }, 800);
  }, 800);
});

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
