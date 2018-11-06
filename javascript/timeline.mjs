
import { app, Graphics, canvas, Point } from './graphics.mjs';
import { chronos } from './chronos.mjs';
import { Wiki } from './wiki.mjs';
import { color } from './colors.mjs';
export { Timeline };

class Timeline {
  //
  // constructor
  //
  constructor() {
    this.date_first = new chronos.Date(-10000);
    this.date_last = new chronos.Date(2018);
    this._pos_y = 1 / 1.618;
    this._events = [];
    this._line = new Graphics();
    this._max_zoom = 250;
    this._min_zoom = this.date_last.year - this.date_first.year;
    this._scroll_min = this.date_first;
    this._scroll_max = this.date_last;
    this._split_date = undefined;
    this._split_pos = 0;
    this._split_width = 250;
    this._date_type = 'holocene';
    this._bubble_dia_min = 50;
    this._bubble_dia_max = 120;
    this._bubble_rad_cur = this._bubble_dia_max;
    this._last_fit = new Date().getTime();

    // draw line
    this._line.lineStyle(4, color.line, 1);
    this._line.moveTo(0, 0);
    this._line.lineTo(canvas.width, 0);
    this._line.position.y = this._pos_y * canvas.height;
    app.stage.addChild(this._line);

    // start & end date marker
    //
    $('.label-start > p').text('year ' + this._GetPositionDate(canvas.width / 100).toStringType(this._date_type));
    $('.label-end > p').text('year ' + this._GetPositionDate(canvas.width / 100 * 99).toStringType(this._date_type));

  }

  //
  // Resize
  //
  Resize() {
    let now = new Date().getTime();
    this._line.width = canvas.width;
    for (let event of this._events) {
      event._bubble.position.x = this._GetDatePosition(event.date).x;
      event._date_label.position.x = event._bubble.position.x;
      this.HideCollidingDates();
      $('.label-start > p').text('year ' + this._GetPositionDate(canvas.width / 100).toStringType(this._date_type));
      $('.label-end > p').text('year ' + this._GetPositionDate(canvas.width / 100 * 99).toStringType(this._date_type));
    }
    if (now - this._last_fit > 100) {
      this.FitBubbles();
      this._last_fit = now;
    }
  }

  //
  // Fit Bubbles
  //
  FitBubbles() {
    // get bubbles that are visible
    const events = this._events.filter(event =>
      event._bubble.position.x + this._bubble_rad_cur >= 0 ||
      event._bubble.position.x - this._bubble_rad_cur <= canvas.width
    );

    // get minimum permitted diameter
    let dist_min = this._bubble_dia_max;
    let collide = false;
    if (events.length >= 2) {
      for (let i = 1; i < events.length; i ++) {
        let dist = events[i]._bubble.position.x - events[i-1]._bubble.position.x;
        if (dist < dist_min && dist >= this._bubble_dia_min)
          dist_min = dist;
        else if (dist < this._bubble_dia_min)
          collide = true;
      }
    }

    const rad_new = collide ? this._bubble_dia_min : dist_min / 2;
    this._bubble_rad_cur = rad_new;

    // set new radius & reset y
    events.forEach(event => {
      this._RenderBubble(event, rad_new, 2, event._bubble.position);
      event._bubble.position.y = this._line.position.y;
      event._date_label.position.y = event._bubble.position.y + this._bubble_rad_cur + 20;
    });

    // settle collisions
    if (collide) {
      this._SolveBubbleCollisions(events);
    }
  }

  _SolveBubbleCollisions(events) {
    if (events.length < 2) return;
    const off_y = this._bubble_rad_cur * 1.2;
    let dir = true;
    for (let i = 1; i < events.length; i++) {
      const dist = events[i]._bubble.position.x - events[i-1]._bubble.position.x;
      if (dist < this._bubble_dia_max) {
        if (events[i-1]._bubble.position.y == this._line.position.y) {
          events[i-1]._bubble.position.y = this._line.position.y + off_y * (dir ? 1 : -1);
          events[i-1]._date_label.position.y = events[i-1]._bubble.position.y + (this._bubble_rad_cur + 20) * (dir ? 1 : -1);
          dir = !dir;
        }
        events[i]._bubble.position.y = this._line.position.y + off_y * (dir ? 1 : -1);
        events[i]._date_label.position.y = events[i]._bubble.position.y + (this._bubble_rad_cur + 20) * (dir ? 1 : -1);;
        dir = !dir;
      }
    }
  }

  //
  // Set Date Type
  //
  SetDateType(type) {
    this._date_type = type.toLowerCase();
    $('.label-start > p').text('year ' + this._GetPositionDate(canvas.width / 100).toStringType(this._date_type));
    $('.label-end > p').text('year ' + this._GetPositionDate(canvas.width / 100 * 99).toStringType(this._date_type));
    for (let event of this._events) {
      event._date_label.text = event.date.toStringType(this._date_type);
    }
  }

  //
  // Split (push events away from info box)
  //
  _SetSplit(date) {
    this._split_pos = this._GetDatePosition(date).x;
    if (this._split_pos - this._split_width / 2 < 0)
      this._split_pos = this._split_width / 2;
    else if (this._split_pos + this._split_width / 2 > canvas.width)
      this._split_pos = canvas.width - this._split_width / 2;
    this._split_date = date;
  }
  _RemoveSplit() {
    this._split_date = undefined;
  }

  //
  // Add event
  //
  AddEvent(timepoint) {
    this._events.push(timepoint);

    timepoint._date_label = this._CreateLabel();

    // add bubble
    this._RenderBubble(timepoint, 20, 2, this._GetDatePosition(timepoint.date));

    // set date label
    timepoint._date_label.text = timepoint.date.toStringType(this._date_type);
    timepoint._date_label.position = timepoint._bubble.position;
    timepoint._date_label.position.y = timepoint._bubble.position.y + this._bubble_rad_cur + 20;
    timepoint._date_label.alpha = 0;

    // date label collision check
    if (this._events.length >= 2) {
      let l1 = timepoint._date_label;
      let l2 = this._events[this._events.length - 2]._date_label;
      if (l2.visible && l1.position.x - l1.width / 2 <= l2.position.x + l2.width / 2) {
        l1.visible = false;
      }
    }

    app.stage.addChild(timepoint._date_label);
  }

  //
  // Render Bubble
  //
  _RenderBubble(event, radius, border_width, position) {
    app.stage.removeChild(event._bubble);
    event._bubble = new Graphics;
    event._bubble.lineStyle(border_width, color.line, 1);
    event._bubble.beginFill(color.fill);
    event._bubble.drawCircle(0, 0, radius);
    event._bubble.position = position;
    event._bubble.endFill();
    app.stage.addChild(event._bubble);
  }

  //
  // Hide Colliding Dates
  //
  HideCollidingDates() {
    if (this._events.length < 2) return;
    for (let i = 1; i < this._events.length; i++) {
      let l1 = this._events[this._events.length - 1]._date_label;
      let l2 = this._events[this._events.length - 2]._date_label;
      l1.visible = (l2.visible && l1.position.x - l1.width / 2 <= l2.position.x + l2.width / 2) ? false : true;
    }
  }

  //
  // Print events to console
  //
  LogTimepoints() {
    let form_data = [];
    this._events.forEach(e => form_data.push({
      name: e.name,
      gregorian: e.date.gregorian.toString(),
      holocene: e.date.holocene.toString(),
      pos_x: `${e._bubble.position.x} (${Math.round(e._bubble.position.x / canvas.width * 100)}%)`,
      pos_y: `${e._bubble.position.y} (${Math.round(e._bubble.position.y / canvas.height * 100)}%)`
    }));
    console.table(form_data);
  }

  //
  // Get Date Position
  //
  _GetDatePosition(date) {
    let pos_x = canvas.width / (this.date_last.year - this.date_first.year) * (date.year - this.date_first.year);
    if (this._split_date) {
      if (date.year < this._split_date.year) {
        pos_x = (this._split_pos - this._split_width / 2) / (this._split_date.year - this.date_first.year) * (date.year - this.date_first.year);
      } else if (date.year > this._split_date.year) {
        const split = this._split_pos + this._split_width / 2;
        pos_x = split + (canvas.width - split) / (this.date_last.year - this._split_date.year) * (date.year - this._split_date.year);
      } else {
        pos_x = this._split_pos;
      }
    }
    return new Point(Math.round(pos_x), Math.round(this._line.position.y));

  }
  _GetPositionDate(px) {
    return new chronos.Date(px / canvas.width * (this.date_last.year - this.date_first.year) + this.date_first.year);
  }

  //
  // Create Date Label
  //
  _CreateLabel() {
    let label = new PIXI.Text('', new PIXI.TextStyle({
      fontFamily: "Helvetica",
      fontSize: 13
    }));
    label.anchor.set(0.5, 0.5);
    return label;
  }

  //
  // open title-box
  //
  _OpenTitleBox(event) {
    $(".hero h1").html(event.name);
    $(".hero").css("top", event._bubble.position.y - ($(".hero").outerHeight() / 2) - 85);
    $(".hero").css("left", event._bubble.position.x - $(".hero").outerWidth() / 2);
    $(".hero").show();
  }

  //
  // close title-box
  //
  _CloseTitleBox(event) {
    $(".hero").hide();
  }

  //
  // open & close info box
  //
  _OpenInfoBox(event) {
    this._CloseTitleBox();
    $('#infobox-image').attr('src', 'https://via.placeholder.com/150')
    // set title
    $("#infobox > h1").html(event.name);
    $("#infobox > p").html("loading description...");
    $("#infobox").css({width: '100px', height: '100px'});
    let left = this._split_pos - $('#infobox').outerWidth() / 2;
    let top = this._line.position.y - $('#infobox').outerHeight() / 2;
    $("#infobox").css({left: left, top: top});
    // show infobox
    $("#infobox").show();
    $('#infobox').animate({
      left: left - (250 - $('#infobox').outerWidth()) / 2,
      top: top - (250 - $('#infobox').outerHeight()) / 2,
      width: '250px',
      height: '250px'
    }, 200);

    Wiki.GetExtract(event.wiki_ref, extract => {
      $('#infobox > p').text(extract);
    });

    // image
    Wiki.GetImage(event.wiki_ref, img => {
      $('#infobox-image').attr('src', img);
      console.log(img);
    });
  }

  _HideInfoBox() {
    $("#infobox").hide();
    $('#infobox-image').attr('src', 'https://via.placeholder.com/150')
  }


  /*
███████ ██    ██ ███████ ███    ██ ████████ ███████
██      ██    ██ ██      ████   ██    ██    ██
█████   ██    ██ █████   ██ ██  ██    ██    ███████
██       ██  ██  ██      ██  ██ ██    ██         ██
███████   ████   ███████ ██   ████    ██    ███████
*/


  //
  // Update date visibility on mouse move
  //
  MouseMove(mousepos) {
    this._CloseTitleBox();
    for (let event of this._events) {
      const dx = Math.abs(mousepos.x - event._bubble.position.x);
      // set date visibility
      event._date_label.alpha = dx < 150 ? (150 - Math.pow(dx, 1.2)) / 150 : 0;
      // precheck dx to avoid sqrt
      if (dx > event._bubble.width / 2)
        continue;
      // show nametag if hover
      const dist = Math.sqrt(Math.pow(mousepos.x - event._bubble.position.x, 2) + Math.pow(mousepos.y - event._bubble.position.y, 2));
      if (dist <= this._bubble_rad_cur) {
        this._OpenTitleBox(event);
      } else {
        this._CloseTitleBox();
      }
    }
  }

  //
  // Handle Click
  //
  HandleClick(mousepos) {
    let hit = undefined;
    for (let event of this._events) {
      const dist = Math.sqrt(Math.pow(mousepos.x - event._bubble.position.x, 2) + Math.pow(mousepos.y - event._bubble.position.y, 2));
      if (dist <= event._bubble.width / 2) {
        hit = event;
        break;
      }
    }
    if (hit) {
      this._SetSplit(hit.date);
      this._OpenInfoBox(hit);
    }
    else {
      this._RemoveSplit();
      this._HideInfoBox();
    }
    this.Resize();
  }


  /*
███████  ██████   ██████  ███    ███        ██        ███████  ██████ ██████   ██████  ██      ██
   ███  ██    ██ ██    ██ ████  ████        ██        ██      ██      ██   ██ ██    ██ ██      ██
  ███   ██    ██ ██    ██ ██ ████ ██     ████████     ███████ ██      ██████  ██    ██ ██      ██
 ███    ██    ██ ██    ██ ██  ██  ██     ██  ██            ██ ██      ██   ██ ██    ██ ██      ██
███████  ██████   ██████  ██      ██     ██████       ███████  ██████ ██   ██  ██████  ███████ ███████
*/


  //
  // Zoom
  //
  Zoom(dy, px) {
    this._RemoveSplit();
    this._HideInfoBox();
    let zoom_years = this._GetZoomStep(dy);
    let zoom_target = this._GetPositionDate(px);
    let zoom_bias = this._GetZoomBias(zoom_target);
    this.date_first = new chronos.Date(this.date_first.year + zoom_years * zoom_bias);
    this.date_last = new chronos.Date(this.date_last.year - zoom_years * (1 - zoom_bias));
    // enforce min & max zoom level
    if (this.date_last.year - this.date_first.year < this._max_zoom)
      this._ZoomAdjust(this._max_zoom, zoom_bias);
    else if (this.date_last.year - this.date_first.year > this._min_zoom)
      this._ZoomAdjust(this._min_zoom, zoom_bias);
    this._ScrollAdjust();
    this.Resize();
  }
  _ZoomAdjust(target_zoom, zoom_bias = 0.5) {
    let zoom_adjust = target_zoom - (this.date_last.year - this.date_first.year);
    this.date_first = new chronos.Date(this.date_first.year - zoom_adjust * zoom_bias);
    this.date_last = new chronos.Date(this.date_last.year + zoom_adjust * (1 - zoom_bias));
  }

  //
  // Scroll
  //
  Scroll(dx) {
    this._RemoveSplit();
    this._HideInfoBox();
    let scroll_step = this._GetScrollStep(dx);
    this.date_first = new chronos.Date(this.date_first.year + scroll_step);
    this.date_last = new chronos.Date(this.date_last.year + scroll_step);
    this._ScrollAdjust();
    this.Resize();
  }
  _ScrollAdjust() {
    // keep in bounds
    if (this.date_first.year < this._scroll_min.year || this.date_last.year > this._scroll_max.year) {
      let scroll_adjust = this.date_first.year < this._scroll_min.year ?
        this._scroll_min.year - this.date_first.year :
        this._scroll_max.year - this.date_last.year;
      this.date_first = new chronos.Date(this.date_first.year + scroll_adjust);
      this.date_last = new chronos.Date(this.date_last.year + scroll_adjust);
    }
  }

  _GetZoomStep(speed_mult = 1) {
    return (this.date_last.year - this.date_first.year) / 200 * -speed_mult;
  }
  _GetZoomBias(zoom_target) {
    return (zoom_target.year - this.date_first.year) / (this.date_last.year - this.date_first.year);
  }
  _GetScrollStep(speed_mult = 1) {
    return (this.date_last.year - this.date_first.year) / 1000 * speed_mult;
  }

  //
  // Scroll To
  //
  ScrollTo(date, duration = 700, on_done = undefined) {
    const frame_rate = 16;
    const steps_total = Math.round(duration / frame_rate);
    const start_date = this._GetPositionDate(canvas.width / 2);

    const timeframe = this.date_last.year - this.date_first.year;
    let pos_last = start_date.year;
    for (let i = 0; i < steps_total; i++) {

      const t = i / (steps_total - 1);
      const step = Math.pow(t, 2) / ( 2 * (Math.pow(t, 2) - t) + 1 );

      const pos = start_date.year + (date.year - start_date.year) * step;
      const pos_delta = pos - pos_last;

      setTimeout(step => {
        this.date_first = new chronos.Date(this.date_first.year + pos_delta);
        this.date_last = new chronos.Date(this.date_last.year + pos_delta);
        this._ScrollAdjust();
        this.Resize();
      }, i * frame_rate);
      pos_last = pos;
    }

    if (on_done) setTimeout(on_done, duration);

  }

  //
  // Zoom To
  //
  ZoomTo(timeframe, duration = 700, on_done = undefined) {
    const frame_rate = 16;
    const steps_total = Math.round(duration / frame_rate);
    const start_frame = this.date_last.year - this.date_first.year;

    let frame_last = start_frame;
    for (let i = 0; i < steps_total; i++) {

      const t = i / (steps_total - 1);
      const step = Math.pow(t, 2) / ( 2 * (Math.pow(t, 2) - t) + 1 );

      let frame_new = start_frame + (timeframe - start_frame) * step;
      let zoom_step =  frame_new - frame_last;

      setTimeout(step => {
        let frame_cur = this.date_last.year - this.date_first.year;
        this.date_first = new chronos.Date(this.date_first.year - zoom_step / 2);
        this.date_last = new chronos.Date(this.date_last.year + zoom_step / 2);
        if (this.date_last.year - this.date_first.year > this._min_zoom)
          this._ZoomAdjust(this._min_zoom, 0.5);
        this._ScrollAdjust();
        this.Resize();
      }, i * frame_rate);

      frame_last = frame_new;
    }

    if (on_done) setTimeout(on_done, duration);

  }

}
