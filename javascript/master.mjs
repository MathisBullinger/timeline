'use strict';

import {chronos} from './chronos.mjs';
import {InitPixi, LoadTextures, Resize, app, view, renderer, settings, Graphics} from './graphics.mjs';

function can_width() {
  return $('#timeline').width();
}
function can_height() {
  return $('#timeline').height();
}

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
    this.line._graphic.moveTo(0, this.line._y * can_height());
    this.line._graphic.lineTo(can_width(), this.line._y * can_height());
    app.stage.addChild(this.line._graphic);

    this.timepoints._y = this.line._y;
    this.timepoints._min = this.start;
    this.timepoints._max = this.end;
  },

  Rescale: function() {
    // line
    this.Create();
    // timepoints
    for (let i = this.timepoints._points.length - 1; i >= 0; i--) {
      // remove drawing
      app.stage.removeChild(this.timepoints._points[i]._graphic);
      app.stage.removeChild(this.timepoints._points[i]._label);
      // remove point
      let tmp_point = this.timepoints._points.splice(i, 1)[0];
      // add point
      this.timepoints.add(tmp_point.name, tmp_point.date);
    }
  },

  click: function(x, y) {
    if (!(y > this.y - this.event_radius && y < this.y + this.event_radius))
      return undefined;
    for (let point of this.timepoints._points) {
      let px = point._graphic.position.x;
      let pr = point._graphic.width / 2;
      if (x >= px - pr && x <= px + pr)
        return point;
    }
  },

  //
  // properties
  //
  start: new chronos.Date(-10000),
  end: new chronos.Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),

  get y() {
    return this.line._y * can_height();
  },
  get event_radius() {
    return 15;
  },

  timepoints: {
    _points: [],

    add: function(name, date) {
      this._points.push(new chronos.Timepoint(name, date));

      // add bubble
      this._points[this._points.length - 1]['_graphic'] = new Graphics();
      let graphic = this._points[this._points.length - 1]['_graphic'];
      graphic.lineStyle(1, 0x000000, 1);
      graphic.drawCircle(0, 0, $(window).innerWidth() < 800 ? 4 : 8);
      graphic.position.set((date.year+10000) / (this._max.year + 10000) * can_width(), this._y * can_height());
      app.stage.addChild(graphic);

      // add text label
      this._points[this._points.length - 1]['_label'] = new PIXI.Text(name, new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: $(window).innerWidth() < 580 ? 10 : 14
      }));
      let label = this._points[this._points.length - 1]['_label'];
      label.position.x = (date.year+10000) / (this._max.year + 10000) * can_width() - 10;
      label.position.y = this._y * can_height() - 25;
      label.rotation = -1.5;
      app.stage.addChild(label);

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
function HandleScroll(x, y) {}

//
// Handle Click
//
function HandleClick(x, y) {
  let hit = timeline.click(x, y);
  if (hit) {
    console.log(`clicked on ${hit.date.gregorian.toString()} - "${hit.name}"`);
  }
}

//
// Window Resize
//
$(window).resize(Debounce(_ => {
  Resize();
  timeline.Rescale();
}));

//
// (Mouse) Wheel
//
document.body.addEventListener('wheel', e => HandleScroll(e.deltaX, e.deltaY), {passive: true});

//
// Click
//
$('#timeline').click(e => HandleClick(e.clientX, e.clientY));

//
// Debounce
//
function Debounce(callback, delay = 50) {
  let timer_id;
  return function (...args) {
    if (timer_id) {
      clearTimeout(timer_id);
    }
    timer_id = setTimeout(() => {
      callback(...args);
      timer_id = null;
    }, delay);
  }
}

/*
███████ ███    ██ ████████ ██████  ██    ██
██      ████   ██    ██    ██   ██  ██  ██
█████   ██ ██  ██    ██    ██████    ████
██      ██  ██ ██    ██    ██   ██    ██
███████ ██   ████    ██    ██   ██    ██
*/

InitPixi();
timeline.Create();

(today => console.log(`\n  ${ '\u{1F4C5} \u{1F5D3} '.repeat(7)}\u{1F4C5}\n\nToday is the ${today.gregorian.toString()} - that's the ${today.holocene.toString()} in the Holocene calendar.\n
%c\u2796\u{1F54C}\u2796\u{1F53A}\u2796\u{1F5FF}\u2796\u{1F3DB}\u2796\u{1F3F0}\u2796\u{1F3ED}\u2796\u{1F680}\u2796\n`, 'font-size: 20px'))(new chronos.Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

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

//console.log('stage', app.stage);
//console.log(app.stage.scale);
//console.log(app.stage.width);
//console.log(app.stage.scale);
//app.stage.scale.set(0.5);
