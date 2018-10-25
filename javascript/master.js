'use strict';

$(function() {

  $('#timeline').css('height', window.innerHeight);

  InitPixi();
  // CreateTimeline();
  timeline.Create();
  timeline.SetColor(0xFF0000);

});


/*
██████  ██ ██   ██ ██     ███████ ████████ ██    ██ ███████ ███████
██   ██ ██  ██ ██  ██     ██         ██    ██    ██ ██      ██
██████  ██   ███   ██     ███████    ██    ██    ██ █████   █████
██      ██  ██ ██  ██          ██    ██    ██    ██ ██      ██
██      ██ ██   ██ ██     ███████    ██     ██████  ██      ██
*/

/*********/
let app = undefined;
let renderer = undefined;
let Graphics = PIXI.Graphics;
let path_images = 'data/img/';
let sprites = {};
let timeline = {};
/*********/

//
// Init Pixi
//
function InitPixi() {
  let type = "WebGL"
  if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas"
  }

  PIXI.utils.sayHello(type)

  // create pixi app
  let container = $('#timeline');
  app = new PIXI.Application({
    width: container.width(),
    height: container.height(),
    antialias: true
  });

  renderer = app.renderer;
  renderer.backgroundColor = 0xDDEEDD;
  renderer.autoResize = true;

  renderer.view.style.width = '100%';
  renderer.view.style.height = '100%';

  // add canvas to HTML
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
██████  ███████ ███    ██ ██████  ███████ ██████  ██ ███    ██  ██████
██   ██ ██      ████   ██ ██   ██ ██      ██   ██ ██ ████   ██ ██
██████  █████   ██ ██  ██ ██   ██ █████   ██████  ██ ██ ██  ██ ██   ███
██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██ ██ ██  ██ ██ ██    ██
██   ██ ███████ ██   ████ ██████  ███████ ██   ██ ██ ██   ████  ██████
*/


//
// Timeline
//
timeline = {

  Create: function() {
    this.line = new Graphics();
    this.line.lineStyle(2, this.color, 1);
    this.line.moveTo(0, 50);
    this.line.lineTo(500, 50);

    app.stage.addChild(this.line);
  },

  SetColor: function(color) {
    // this.color = color;
    // this.line.lineStyle(2, this.color, 1);
  },

  line: undefined,
  color: 0x000000

}


/*
███    ███ ██ ███████  ██████
████  ████ ██ ██      ██
██ ████ ██ ██ ███████ ██
██  ██  ██ ██      ██ ██
██      ██ ██ ███████  ██████
*/

//
// resize timeline on window resize
//
$(window).resize(
  Debounce(()=>{
    $('#timeline').css('height', window.innerHeight);
  }, 50 )
);

function Debounce(func, wait) {
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
