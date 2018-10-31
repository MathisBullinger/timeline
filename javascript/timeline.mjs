
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
    this._max_zoom = 1000;
    this._min_zoom = this.date_last.year - this.date_first.year;
    this._scroll_min = this.date_first;
    this._scroll_max = this.date_last;

    // draw line
    this._line.lineStyle(2, 0x000000, 1);
    this._line.moveTo(0, 0);
    this._line.lineTo(canvas.width, 0);
    this._line.position.y = this._pos_y * canvas.height;
    app.stage.addChild(this._line);

  }

  //
  // Resize
  //
  Resize() {
    // resize line
    this._line.width = canvas.width;
    for (event of this._events) {
      // adjust timepoint positions
      event._bubble.position = this._GetDatePosition(event.date);
      event._date_label.position.x = event._bubble.position.x;
      event._name_label.position.x = event._bubble.position.x;
      // hide name tags
      event._name_label.visible = false;
    }
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
    timepoint._bubble.beginFill(0xFFFFFF);
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

    app.stage.addChild(timepoint._bubble, timepoint._date_label, timepoint._name_label);
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
    let pos_x = 0 + canvas.width / (this.date_last.year - this.date_first.year) * (date.year - this.date_first.year);
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

  AbsolutePosition(date) {
    return (date.year - this.date_first.year) / (this.date_last.year - this.date_first.year) * canvas.width;
  }

  //
  // Zoom
  //
  Zoom(dy, px) {
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
}