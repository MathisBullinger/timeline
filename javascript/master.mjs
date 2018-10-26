'use strict';

import {chronos} from './chronos.mjs';
import {InitPixi, LoadTextures, app, Graphics} from './graphics.mjs';

/*
████████ ██ ███    ███ ███████ ██      ██ ███    ██ ███████
   ██    ██ ████  ████ ██      ██      ██ ████   ██ ██
   ██    ██ ██ ████ ██ █████   ██      ██ ██ ██  ██ █████
   ██    ██ ██  ██  ██ ██      ██      ██ ██  ██ ██ ██
   ██    ██ ██      ██ ███████ ███████ ██ ██   ████ ███████
*/

var timeline = {

  //
  // Create
  //
  Create: function() {
    if (this.line._graphic)
      app.stage.removeChild(this.line._graphic);
    this.line._graphic = new Graphics();
    this.line._graphic.lineStyle(this.line._width, this.line._color, 1);
    this.line._graphic.moveTo(0, this.line._y * $('#timeline').height());
    this.line._graphic.lineTo($('#timeline').width(), this.line._y * $('#timeline').height());
    app.stage.addChild(this.line._graphic);
    this.timepoints._y = this.line._y;
    this.timepoints._min = this.start;
    this.timepoints._max = this.end;
  },

  //
  // properties
  //
  start: new chronos.Date(-10000),
  end: new chronos.Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),

  timepoints: {
    _points: [],
    add: function(name, date) {
      this._points.push(new chronos.Timepoint(name, date));
      // add bubble
      let graphic = this._points[this._points.length - 1]['_graphic'];
      graphic = new Graphics();
      graphic.lineStyle(1, 0x000000, 1);
      graphic.drawCircle(
        (date.year+10000) / (this._max.year + 10000) * $('#timeline').width(),
        this._y * $('#timeline').height(),
        8);
      //graphic.x = 0;
      app.stage.addChild(graphic);
      // add text label
      let label = this._points[this._points.length - 1]['_label'];
      label = new PIXI.Text(name, new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 16,
      }));
      app.stage.addChild(label);
      label.position.x = (date.year+10000) / (this._max.year + 10000) * $('#timeline').width() - 10;
      label.position.y = this._y * $('#timeline').height() - 25;
      label.rotation = -1.5;

      // adjust manually for demo
      if (name == 'Founding of United Nations') {
        label.anchor.set(1,1);
        label.rotation = -1.5;
        label.position.x += 14;
        label.position.y += 40;
      } else if (name == 'Apollo 11') {
        label.position.x -= 5;
      } else if (name == 'First Temple') {
        label.position.x += 10;
      }
    },
    log: function() {
      for (let point of this._points) {
        console.log(`${point.date.gregorian.toString()} \u2014 ${point.name}`)
      }
    },
    _y: undefined,
    _min: undefined,
    _max: undefined
  },

  line: {
    _graphic: undefined,

    _y: 0.7,
    get y() {
      return this._y;
    },
    set y(value) {
      this._y = value;
      this.Create();
    },

    _color: 0x000000,
    get color() {
      return this._color;
    },
    set color(value) {
      this._color = value;
      this.Create();
    },

    _width: 1,
    get width() {
      return this._width;
    },
    set width(value) {
      this._width = value;
      this.Create();
    }
  }

}

/*
███████ ██    ██ ███████ ███    ██ ████████ ███████
██      ██    ██ ██      ████   ██    ██    ██
█████   ██    ██ █████   ██ ██  ██    ██    ███████
██       ██  ██  ██      ██  ██ ██    ██         ██
███████   ████   ███████ ██   ████    ██    ███████
*/

//
// Handle Scroll
//
function Scroll(x, y) {}

//
// Window Resize
//
$(window).resize(Debounce(_ => {
  $('#timeline').css('height', window.innerHeight);
  if (timeline)
    timeline.Create();
  }
));

//
// (Mouse) Wheel
//
document.body.addEventListener('wheel', e => Scroll(e.deltaX, e.deltaY), {passive: true});

//
// Debounce
//
function Debounce(func, wait = 50) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      func.apply(context, args);
    };
    var callNow = !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow)
      func.apply(context, args);
    };
}

/*
███████ ███    ██ ████████ ██████  ██    ██
██      ████   ██    ██    ██   ██  ██  ██
█████   ██ ██  ██    ██    ██████    ████
██      ██  ██ ██    ██    ██   ██    ██
███████ ██   ████    ██    ██   ██    ██
*/

$('#timeline').css('height', window.innerHeight);
InitPixi();
timeline.Create();

(today => console.log(`\n  ${ '\u{1F4C5} \u{1F5D3} '.repeat(7)}\u{1F4C5}\n\nToday is the ${today.gregorian.toString()} - that's the ${today.holocene.toString()} in the Holocene calendar.\n
%c\u2796\u{1F54C}\u2796\u{1F53A}\u2796\u{1F5FF}\u2796\u{1F3DB}\u2796\u{1F3F0}\u2796\u{1F3ED}\u2796\u{1F680}\u2796`, 'font-size: 20px'))(new chronos.Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

timeline.timepoints.add('First Temple', new chronos.Date(-10000));
timeline.timepoints.add('Chinchorro', new chronos.Date(-7000));
timeline.timepoints.add('Indus Valley Civilization', new chronos.Date(-3300));
timeline.timepoints.add('Great Pyramid of Giza', new chronos.Date(-2560));
timeline.timepoints.add('Xia Dynasty', new chronos.Date(-2070));
timeline.timepoints.add('Olmecs in Mexico', new chronos.Date(-1500));
timeline.timepoints.add('Late Bronze Age collapse', new chronos.Date(-1200));
timeline.timepoints.add('Ancient Greece', new chronos.Date(-900));
timeline.timepoints.add('Roman defeats Carthage', new chronos.Date(-146));
timeline.timepoints.add('Mayan started building structure with Long Count', new chronos.Date(250));
timeline.timepoints.add('Colonization of the Americas', new chronos.Date(1492));
timeline.timepoints.add('Founding of United Nations', new chronos.Date(1945));
timeline.timepoints.add('Apollo 11', new chronos.Date(1969));

timeline.timepoints.log();
