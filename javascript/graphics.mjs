/*
██████  ██ ██   ██ ██     ███████ ████████ ██    ██ ███████ ███████
██   ██ ██  ██ ██  ██     ██         ██    ██    ██ ██      ██
██████  ██   ███   ██     ███████    ██    ██    ██ █████   █████
██      ██  ██ ██  ██          ██    ██    ██    ██ ██      ██
██      ██ ██   ██ ██     ███████    ██     ██████  ██      ██
*/

export { InitPixi, LoadTextures, Resize, app, renderer, view, settings, Graphics };

var app;
var renderer;
var view;
var settings;
var Graphics = PIXI.Graphics;
var path_images = 'data/img/';
var sprites = {};

//
// Init Pixi
//
function InitPixi() {
  $('#timeline').width(window.innerWidth);
  $('#timeline').height(window.innerHeight);

  PIXI.utils.sayHello(PIXI.utils.isWebGLSupported() ? 'WebGL' : 'canvas');

  settings = PIXI.settings;
  settings.RESOLUTION = 2;

  // create & config pixi app
  let container = $('#timeline');
  app = new PIXI.Application({
    width: $('#timeline').width(),
    height: $('#timeline').height(),
    antialias: true,
    autoResize: true,
    resolution: window.devicePixelRatio
  });
  view = app.view;
  renderer = app.renderer;
  renderer.backgroundColor = 0xDDEEED;

  // add pixi canvas to HTML
  container.append(app.view);
}

//
// Resize
//
function Resize() {
  $('#timeline').width($(window).innerWidth());
  $('#timeline').height($(window).innerHeight());
  view.width = $('#timeline').width();
  view.height = $('#timeline').height();
  renderer.resize(view.width, view.height);
  console.log(`resize to (${renderer.width}px, ${renderer.height}px)`);
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
