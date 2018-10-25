$(function() {

  $('#timeline').css('height', window.innerHeight);
  InitPixi();

});

let app = undefined;
function InitPixi() {
  let type = "WebGL"
  if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas"
  }

  PIXI.utils.sayHello(type)

  //Create a Pixi Application
  let container = document.getElementById('timeline');
  app = new PIXI.Application({
    width: container.offsetWidth,
    height: container.offsetHeight,
    antialias: true
  });

  app.renderer.backgroundColor = 0xDDEEDD;
  app.renderer.autoResize = true;

  app.renderer.view.style.width = '100%';
  app.renderer.view.style.height = '100%';

  //Add the canvas that Pixi automatically created for you to the HTML document
  container.appendChild(app.view);

}

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
