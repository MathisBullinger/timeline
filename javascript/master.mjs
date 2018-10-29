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
    // line
    //
    if (this.line._graphic)
      app.stage.removeChild(this.line._graphic);
    this.line._graphic = new Graphics();
    this.line._graphic.lineStyle(this.line._width, this.line._color, 1);
    this.line._graphic.moveTo(0, this.line._y * can_height());
    this.line._graphic.lineTo(can_width(), this.line._y * can_height());
    app.stage.addChild(this.line._graphic);

    // timepoints
    //
    this.timepoints._y = this.line._y;
    this.timepoints._min = this._start;
    this.timepoints._max = this._end;

    // start & end date marker
    //
    if (!this._marker_start) {
      this._marker_start = new PIXI.Text('', new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: $(window).innerWidth() < 580 ? 7 : 12,
        fill: 'gray'
      }));
      this._marker_start.position.set(5, this.line._y * can_height() + 50);
      app.stage.addChild(this._marker_start);
      this._marker_end = new PIXI.Text('', new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: $(window).innerWidth() < 580 ? 7 : 12,
        fill: 'gray'
      }));
      this._marker_end.position.set(can_width() - 5, this.line._y * can_height() + 50);
      this._marker_end.anchor.x = 1;
      app.stage.addChild(this._marker_end);
    }
    let mark_start = this._start.roundToYear();
    let mark_end = this._end.roundToYear();
    // round to century if timescale > 3000
    if (this._end.holocene.year - this._start.holocene.year >= 2000) {
      mark_start = mark_start.roundToCentury();
      mark_end = mark_end.roundToCentury();
    }
    // round to decade if timescale > 500
    if (this._end.holocene.year - this._start.holocene.year >= 500) {
      mark_start = mark_start.roundToDecade();
      mark_end = mark_end.roundToDecade();
    }
    this._marker_start.text = mark_start.gregorian.toStringBCAD();
    this._marker_end.text = mark_end.gregorian.toStringBCAD();

  },

  //
  // Rescale
  //
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

  //
  // Collides
  //
  collides: function(x, y) {
    for (let point of this.timepoints._points) {
      let px = point._graphic.position.x;
      let py = point._graphic.position.y;
      let pr = point._graphic.width / 2;
      if (x >= px - pr && x <= px + pr && y >= py - pr && y <= py + pr)
        return point;
    }
  },

  //
  // Properties
  //
  _start: new chronos.Date(-10000),
  _end: new chronos.Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
  _marker_start: undefined,

  set start(value) {
    this._start = value;
  },
  set end(value) {
    this._end = value;
  },
  get start() { return this._start; },
  get end() { return this._end; },

  get y() {
    return this.line._y * can_height();
  },
  get event_radius() {
    return 15;
  },

  //
  // Timepoints
  //
  timepoints: {
    _points: [],

    add: function(name, date) {
      this._points.push(new chronos.Timepoint(name, date));

      // add bubble
      //
      this._points[this._points.length - 1]['_graphic'] = new Graphics();
      let graphic = this._points[this._points.length - 1]['_graphic'];
      graphic.lineStyle(1, 0x000000, 1);
      graphic.beginFill(0xFFFFFF);
      graphic.drawCircle(0, 0, this.rad_min);
      graphic.endFill();
      let pos_x = parseFloat((date.holocene.year - this._min.holocene.year)) / (this._max.holocene.year - this._min.holocene.year) * can_width();
      graphic.position.set(pos_x, this._y * can_height());

      //
      // adjust if collision
      for (let point of this._points) {
        if (point.name == name) continue;
        if (point._graphic.position.y != this._y * can_height()) continue;
        let dist = pos_x > point._graphic.position.x ? pos_x - point._graphic.position.x : point._graphic.position.x - pos_x;
        if (dist < this.rad_min * 2) {
          let off_y = this.rad_min - dist / 2 + 5;
          if (point._graphic.position.x < graphic.position.x) {
            point._graphic.position.y -= off_y;
            graphic.position.y += off_y;
          } else {
            graphic.position.y -= off_y;
            point._graphic.position.y += off_y;
          }
        }
      }

      app.stage.addChild(graphic);

      // add text label
      this._points[this._points.length - 1]['_label'] = new PIXI.Text(name, new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: $(window).innerWidth() < 580 ? 10 : 14
      }));
      let label = this._points[this._points.length - 1]['_label'];
      label.position.x = pos_x;
      label.position.y = this._y * can_height() - 50;
      label.anchor.x = 0.5;
      label.visible = false;
      if (label.position.x - label.width / 2 < 0) label.anchor.x = 0;
      else if (label.position.x + label.width / 2 > can_width()) label.anchor.x = 1;
      app.stage.addChild(label);
    },

    log: function() {
      for (let point of this._points) {
        console.log(`${point.date.gregorian.toString()} \u2014 ${point.name}`)
      }
    },
    _y: undefined,
    _min: undefined,
    _max: undefined,
    get rad_min() {
      return window.innerHeight / 100;
    }
  },

  //
  // Line
  //
  line: {
    _graphic: undefined,

    _y: 1 / 1.61,
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
// Handle Scroll & Zoom
//
function HandleScroll(x, y, pos_x) {
  let mode = Math.abs(x) > Math.abs(y) ? 'scroll' : 'zoom';
  if (mode == 'zoom') {
    // zoom
    let zoom_target = pos_x / can_width();
    let years_zoom = (timeline.end.holocene.year - timeline.start.holocene.year) / 200 * y;
    let start_new = new chronos.Date( (timeline.start.year - years_zoom * (zoom_target)) );
    let end_new = new chronos.Date( timeline.end.year + years_zoom * (1 - zoom_target) );
    // max zoom
    let max_zoom = 1000;
    if (end_new.holocene.year - start_new.holocene.year <= max_zoom) {
      if (timeline.start.holocene.year - timeline.end.holocene.year <= max_zoom) return;
      start_new = new chronos.Date(end_new.year - max_zoom - 0.01);
    };
    if (start_new.holocene.year < 0) start_new = new chronos.Date(-10000);
    if (end_new.holocene.year > 12018) end_new = new chronos.Date(2018);
    timeline.start = start_new;
    timeline.end = end_new;
  } else {
    // scroll
    let years_scroll = (timeline.end.holocene.year - timeline.start.holocene.year) / 500 * x;
    let start_new = new chronos.Date( timeline.start.year + years_scroll );
    let end_new = new chronos.Date( timeline.end.year + years_scroll );
    if (end_new.holocene.year > 12018) {
      let delta_end = 12018 - timeline.end.holocene.year;
      end_new = new chronos.Date(2018);
      start_new = new chronos.Date(timeline.start.year + delta_end);
    } else if (start_new.holocene.year < 0) {
      let delta_start = 0 - timeline.start.holocene.year;
      start_new = new chronos.Date(-10000);
      end_new = new chronos.Date(timeline.end.year + delta_start);
    }
    timeline.start = start_new;
    timeline.end = end_new;
  }
  timeline.Rescale();
}

//
// Handle Mouse Move
//
var mouse_pos_last = -1
function HandleMousemove(mouse_x, mouse_y) {
  // mouse over timepoint
  //
  let hit = timeline.collides(mouse_x, mouse_y);
  for (let point of timeline.timepoints._points) {
    // if (point == hit)
    //   point._label.visible
    point._label.visible = point == hit ? true : false;
  }
  // if (hit) {
  //   hit._label.visible = true;
  // }
  // scroll timeline
  //
  if (!mousedown) return;
  if (mouse_pos_last == -1) mouse_pos_last = mouse_x;
  let delta_mouse = mouse_x - mouse_pos_last;
  mouse_pos_last = mouse_x;
  if (delta_mouse == 0) return;
  HandleScroll(-delta_mouse * 0.8, 0);
}

//
// Handle Click
//
function HandleClick(x, y) {
  let hit = timeline.collides(x, y);
  if (hit) {
    console.log(`clicked on ${hit.date.gregorian.toString()} - "${hit.name}"`);
  }
}

//
// disable context menu
//
$('#timeline').on('contextmenu', _ => false);

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
document.body.addEventListener('wheel', e => HandleScroll(e.deltaX, e.deltaY, e.clientX), {passive: true});

//
// Click
//
$('#timeline').click(e => HandleClick(e.clientX, e.clientY));

//
// detect mouse drag
//
var mousedown = false;
$('#timeline').mousedown(_ => mousedown = true);
$('#timeline').mouseup(_ => {mousedown = false; mouse_pos_last = -1;});
$('#timeline').mousemove(e => HandleMousemove(e.clientX, e.clientY));

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

//
// Display mobile warning
//
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  $('body').append(`
    <div class="phoneblock">
      <p>This website doesn't support a mobile view yet.<p>
      <button id="bt-mobile-show">Show me anyway!</button>
    </div>
  `);
  $('#bt-mobile-show').click(_ => $('.phoneblock').css('display', 'none'));
}

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
