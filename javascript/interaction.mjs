
export { interaction, Throttle };
import { Resize, Point } from './graphics.mjs';


const interaction = {

  start: function(timeline) {

    //
    // (Mouse) Wheel
    //
    let _wheel_mode = 'none';
    let _scroll_last = new Date();

    document.body.addEventListener('wheel', event => {
      if (event.target.className.includes('infobox') || event.target.className.includes('modal')) return;

      if (new Date() - this._scroll_last >= 20)
        this._wheel_mode = undefined;

      if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && this._wheel_mode != 'scroll') {
        timeline.Zoom(event.deltaY, event.clientX);
        this._wheel_mode = 'zoom';
      }
      else if (this._wheel_mode != 'zoom') {
        timeline.Scroll(event.deltaX);
        this._wheel_mode = 'scroll';
      }

      this._scroll_last = new Date();
      timeline.MouseMove(new Point(event.clientX, event.clientY));
    }, {passive: true});

    //
    // mouse move
    //
    let mousepos_last = -1;
    $('#timeline').mousemove(Throttle(e => {
      timeline.MouseMove(new Point(e.clientX, e.clientY));
      // scroll timeline
      //
      if (!mousedown) return;
      if (mousepos_last == -1) mousepos_last = e.clientX;
      let delta_mouse = e.clientX - mousepos_last;
      mousepos_last = e.clientX;
      if (delta_mouse != 0)
        timeline.Scroll(-delta_mouse);
    }, 16));

    var mousedown = false;
    $('#timeline').mousedown(_ => mousedown = true);
    $('#timeline').mouseup(_ => {mousedown = false; mousepos_last = -1;});

    //
    // Mouse Click
    //
    $('#timeline').click(e => timeline.HandleClick(new Point(e.clientX, e.clientY)));

    //
    // Prevent mac two finger back swipe & zoom
    //
    $(document).on('mousewheel', e => {
      if (!e.target.className.includes('infobox') && !e.target.className.includes('modal'))
        e.preventDefault()
    });

    //
    // disable context menu
    //
    window.addEventListener('contextmenu', e => e.preventDefault());

    //
    // Window Resize
    //
    $(window).resize(Debounce(_ => {
      Resize();
      timeline.Resize();
    }));

  }
}

function HandleClick(x, y) {
  let hit = timeline.click(x, y);
  if (hit) {
    console.log(`clicked on ${hit.date.gregorian.toString()} - "${hit.name}"`);
  }
}

//
// Debounce & Throttle
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
function Throttle(callback, limit = 50) {
  let last_call = 0;
  return function (...args) {
    let now = (new Date).getTime();
    if (now - last_call < limit) return;
    last_call = now;
    return callback(...args);
  }
}
