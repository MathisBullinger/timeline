'use strict';

import { chronos } from './chronos.mjs';

/*
██████  ██ ██   ██ ██     ███████ ████████ ██    ██ ███████ ███████
██   ██ ██  ██ ██  ██     ██         ██    ██    ██ ██      ██
██████  ██   ███   ██     ███████    ██    ██    ██ █████   █████
██      ██  ██ ██  ██          ██    ██    ██    ██ ██      ██
██      ██ ██   ██ ██     ███████    ██     ██████  ██      ██
*/


/*********/
var app = undefined;
var Graphics = PIXI.Graphics;
var path_images = 'data/img/';
var sprites = {};
var timeline = undefined;
/*********/

//
// Init Pixi
//
function InitPixi() {
  PIXI.utils.sayHello(PIXI.utils.isWebGLSupported() ? 'WebGL' : 'canvas');

  // create & config pixi app
  let container = $('#timeline');
  app = new PIXI.Application({
    width: container.width(),
    height: container.height(),
    antialias: true
  });
  app.renderer.backgroundColor = 0xDDEEDD;
  app.renderer.autoResize = true;
  app.renderer.view.style.width = '100%';
  app.renderer.view.style.height = '100%';

  // add pixi canvas to HTML
  container.append(app.view);
}

//
// Load Textures
//
function LoadTextures(images, on_done) {
  images.forEach((value, i) => { images[i] = path_images + value });
  PIXI.loader.add(images).load(()=>{
    for (let img of images) {
      sprites[img] = new PIXI.Sprite(PIXI.loader.resources[img].texture);

      // set max side width to 400
      let width = sprites[img].width;
      let height = sprites[img].height;
      sprites[img].width = 400 * ( width < height ? width / height : 1 );
      sprites[img].height = 400 * ( height < width ? height / width : 1 );

      // move into screen
      sprites[img].x += sprites[img].width / 2;
      sprites[img].y += sprites[img].height / 2;

      // set anchor to center
      sprites[img].anchor.set(0.5, 0.5);

      app.stage.addChild(sprites[img]);
    }
    on_done();
  });
}

/*
████████ ██ ███    ███ ███████ ██      ██ ███    ██ ███████
   ██    ██ ████  ████ ██      ██      ██ ████   ██ ██
   ██    ██ ██ ████ ██ █████   ██      ██ ██ ██  ██ █████
   ██    ██ ██  ██  ██ ██      ██      ██ ██  ██ ██ ██
   ██    ██ ██      ██ ███████ ███████ ██ ██   ████ ███████
*/


timeline = {

  //
  // Create
  //
  Create: function() {
    if (this.line._graphic) app.stage.removeChild(this.line._graphic);
    this.line._graphic = new Graphics();
    this.line._graphic.lineStyle(this.line._width, this.line._color, 1);
    this.line._graphic.moveTo(0, this.line._y * $('#timeline').height());
    this.line._graphic.lineTo($('#timeline').width(), this.line._y * $('#timeline').height());
    app.stage.addChild(this.line._graphic);
  },

  //
  // properties
  //
  start: new chronos.Date(-10000),
  end: new chronos.Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),

  line: {
    _graphic: undefined,

    _y: 0.5,
    get y() { return this._y; },
    set y(value) { this._y = value; this.Create(); },

    _color: 0x000000,
    get color() { return this._color; },
    set color(value) { this._color = value; this.Create(); },

    _width: 1,
    get width() { return this._width; },
    set width(value) { this._width = value; this.Create(); }
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
$(window).resize(
  Debounce(_=>{
    $('#timeline').css('height', window.innerHeight);
    if (timeline) timeline.Create();
  })
);

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
    if (callNow) func.apply(context, args);
  };
}

$('#timeline').css('height', window.innerHeight);
InitPixi();
timeline.Create();

(today => console.log(`\n  ${'\u{1F4C5} \u{1F5D3} '.repeat(7)}\u{1F4C5}\n\nToday is the ${today.gregorian.toString()} - that's the ${today.holocene.toString()} in the Holocene calendar.\n
%c\u2796\u{1F54C}\u2796\u{1F53A}\u2796\u{1F5FF}\u2796\u{1F3DB}\u2796\u{1F3F0}\u2796\u{1F3ED}\u2796\u{1F680}\u2796`, 'font-size: 20px')
)(new chronos.Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
