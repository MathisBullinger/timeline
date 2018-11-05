
import { app, Graphics, canvas, Point } from './graphics.mjs';
import { chronos } from './chronos.mjs';
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
    this._max_zoom = 500;
    this._min_zoom = this.date_last.year - this.date_first.year;
    this._scroll_min = this.date_first;
    this._scroll_max = this.date_last;
    this._split_date = undefined;
    this._split_pos = 0;
    this._split_width = 250;

    // draw line
    this._line.lineStyle(2, 0x000000, 1);
    this._line.moveTo(0, 0);
    this._line.lineTo(canvas.width, 0);
    this._line.position.y = this._pos_y * canvas.height;
    app.stage.addChild(this._line);

    // start & end date marker
    //
    this._marker_start_line = new Graphics();
    this._marker_start_line.lineStyle(1, 0xAAAAAA, 1);
    this._marker_start_line.moveTo(0, 0);
    this._marker_start_line.lineTo(0, 30);
    this._marker_start_line.position.set(canvas.width / 25, this._line.position.y);
    this._marker_start_date = new PIXI.Text(
      this._GetPositionDate(this._marker_start_line.position.x).holocene.toString(),
        new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 14
      }
    ));
    this._marker_start_date.position.set(this._marker_start_line.position.x, this._line.position.y + 40);
    this._marker_start_date.anchor.x = 0.5;

    this._marker_end_line = new Graphics();
    this._marker_end_line.lineStyle(1, 0xAAAAAA, 1);
    this._marker_end_line.moveTo(0, 0);
    this._marker_end_line.lineTo(0, 30);
    this._marker_end_line.position.set(canvas.width - canvas.width / 25, this._line.position.y);
    this._marker_end_date = new PIXI.Text(
      this._GetPositionDate(this._marker_end_line.position.x).holocene.toString(),
        new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 14
      }
    ));
    this._marker_end_date.position.set(this._marker_end_line.position.x, this._line.position.y + 40);
    this._marker_end_date.anchor.x = 0.5;

    app.stage.addChild(this._marker_start_line, this._marker_start_date,
      this._marker_end_line, this._marker_end_date);

    // info placeholder box
    //
    this._split_box = new Graphics();
    this._split_box.lineStyle(1, 0xDD5555, 1);
    this._split_box.drawRect(0, 0, this._split_width, 100);
    this._split_box.position.set(500, this._line.position.y - this._split_box.height / 2);
    this._split_box.visible = false;
    app.stage.addChild(this._split_box);

  }

  //
  // Resize
  //
  Resize() {
    this._line.width = canvas.width;
    for (let event of this._events) {
      event._bubble.position = this._GetDatePosition(event.date);
      event._date_label.position.x = event._bubble.position.x;
      event._name_label.position.x = event._bubble.position.x;
      event._name_label.visible = false;
      this.HideCollidingDates();
      this._marker_start_line.position.set(canvas.width / 25, this._line.position.y);
      this._marker_start_date.position.set(this._marker_start_line.position.x, this._line.position.y + 40);
      this._marker_end_line.position.set(canvas.width - canvas.width / 25, this._line.position.y);
      this._marker_end_date.position.set(this._marker_end_line.position.x, this._line.position.y + 40);
      this._marker_start_date.text = this._GetPositionDate(this._marker_start_line.position.x).holocene.toString();
      this._marker_end_date.text = this._GetPositionDate(this._marker_end_line.position.x).holocene.toString();
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
    this._split_box.position.x = this._split_pos - this._split_box.width / 2;
    //this._split_box.visible = true;
    console.log('split at', this._split_date.holocene.toString(), this._split_pos);
  }
  _RemoveSplit() {
    this._split_date = undefined;
    this._split_box.visible = false;
  }

  //
  // Add event
  //
  AddEvent(timepoint) {
    this._events.push(timepoint);

    timepoint._bubble = new Graphics();
    timepoint._date_label = this._CreateLabel();
    timepoint._name_label = this._CreateLabel();

    // add bubble
    timepoint._bubble.lineStyle(1, 0x000000, 1);
    let cl = '';
    for (let i = 0; i < 6; i++)
      cl += 'DEF'.charAt(Math.floor(Math.random()*3));
    timepoint._bubble.beginFill(parseInt(cl, 16));
    timepoint._bubble.drawCircle(0, 0, 15);
    timepoint._bubble.endFill();
    timepoint._bubble.position = this._GetDatePosition(timepoint.date);

    // set date label
    timepoint._date_label.text = timepoint.date.holocene.toString();
    timepoint._date_label.position = timepoint._bubble.position;
    timepoint._date_label.position.y += 30;
    timepoint._date_label.alpha = 0;

    // set name label
    timepoint._name_label.text = timepoint.name;
    timepoint._name_label.position = timepoint._bubble.position;
    timepoint._name_label.position.y -= 30;
    timepoint._name_label.visible = false;

    // date label collision check
    if (this._events.length >= 2) {
      let l1 = timepoint._date_label;
      let l2 = this._events[this._events.length - 2]._date_label;
      if (l2.visible && l1.position.x - l1.width / 2 <= l2.position.x + l2.width / 2) {
        l1.visible = false;
      }
    }

    app.stage.addChild(timepoint._bubble, timepoint._date_label, timepoint._name_label);
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
      fontFamily: "Arial",
      fontSize: 11
    }));
    label.anchor.set(0.5, 0.5);
    return label;
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
    $('#timeline').focus();
  }

  //
  // open & close info box
  //
  _OpenInfoBox(event) {
    // set title
    $("#infobox > h1").html(event.name);
    $("#infobox > p").html("text");
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

    // load wiki text
    FetchWikiComment(event.wiki_ref, comment => {
      $('#infobox > p').text(comment);
    });
  }

  _HideInfoBox() {
    $("#infobox").hide();
  }

  //
  // Update date visibility on mouse move
  //
  MouseMove(mousepos) {
    for (let event of this._events) {
      const dx = Math.abs(mousepos.x - event._bubble.position.x);
      // set date visibility
      event._date_label.alpha = dx < 150 ? (150 - Math.pow(dx, 1.2)) / 150 : 0;
      // precheck dx to avoid sqrt
      if (dx > event._bubble.width / 2) {
        event._name_label.visible = false;
        continue;
      }
      // show nametag if hover
      const dist = Math.sqrt(Math.pow(mousepos.x - event._bubble.position.x, 2) + Math.pow(mousepos.y - event._bubble.position.y, 2));
      event._name_label.visible = dist <= event._bubble.width / 2 ? true : false;
    }
  }

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
    console.log('scroll to ' + date.holocene.toString());
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
    console.log('zoom to ' + timeframe);
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

//
// structure wiki article data
//
function FetchWikiComment(ref, callback) {
  // load and parse dbpedia info
  LoadJSON(encodeURI('http://dbpedia.org/data/' + ref + '.json'), function(response) {
    let data;
    try {
      data = JSON.parse(response)['http://dbpedia.org/resource/' + ref];
      for (let property in data) {
        if (data.hasOwnProperty(property)) {
          if (property.includes('comment')) {
            for (let comment of data[property]) {
              if (comment.lang == 'en') {
                callback(comment.value);
                return;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("can't parse JSON", err);
    }
  });
}

function LoadJSON(file, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', file, true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState == 4 && xobj.status == "200") {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}
