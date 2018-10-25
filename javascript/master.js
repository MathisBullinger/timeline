'use strict';

$(function() {

  $('#timeline').css('height', window.innerHeight);

  InitPixi();
  LoadTextures(['data/img/fruits.png']);

});

/*********/
let app = undefined;
let renderer = undefined;
let path_images = 'data/img/';
let sprites = {};
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
function LoadTextures(images) {
  images.forEach(img => path_images + img);
  PIXI.loader.add(images).load(()=>{
    for (let img of images) {
      //console.log(img);
      sprites[img] = new PIXI.Sprite(PIXI.loader.resources[img].texture);
      app.stage.addChild(sprites[img]);
    }
  });
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
