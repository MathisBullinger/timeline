import {app, Graphics, canvas, Point, textures, LoadTextures} from './graphics.mjs';
import {chronos} from './chronos.mjs';
import {Wiki} from './wiki.mjs';
import {color} from './colors.mjs';
export {
  Timeline
};

class Timeline {
  //
  // constructor
  //
  constructor() {
    // current start and end
    this.date_first = new chronos.Date(-10000);
    this.date_last = new chronos.Date(2018);
    this._pos_y = 1 / 1.618;
    this._events = [];
    this._line = new Graphics();
    // absolute start and end
    this._time_start = new chronos.Date(-10000);
    this._time_end = new chronos.Date(2018);
    // scroll cap
    this._scroll_min = new chronos.Date();
    this._scroll_max = new chronos.Date();
    //this._ApplyMargin();
    this._max_zoom = 250;
    this._min_zoom = 12000;
    this._ApplyMargin();
    this._split_date = undefined;
    this._split_pos = 0;
    this._split_width = 250;
    this._date_type = 'holocene';
    this._bubble_rad_min = 30;
    this._bubble_rad_max = 120;
    this._last_fit = new Date().getTime();
    this._date_label_offset = $('.label-start').offset().left / canvas.width;
    this._minimap_markers = [];

    this.Zoom(21, canvas.width / 2);

    // draw line
    this._line.lineStyle(4, color.line, 1);
    this._line.moveTo(0, 0);
    this._line.lineTo(canvas.width, 0);
    this._line.position.y = this._pos_y * canvas.height;
    app.stage.addChild(this._line);

    // start & end date marker
    //
    $('.label-start > p').text('year ' + this._GetPositionDate(canvas.width * this._date_label_offset).toStringType(this._date_type));
    $('.label-end > p').text('year ' + this._GetPositionDate(canvas.width - canvas.width * this._date_label_offset).toStringType(this._date_type));

  }

  //
  // Resize
  //
  Resize() {
    this._ApplyMargin();
    let now = new Date().getTime();
    this._line.width = canvas.width;
    for (let event of this._events) {
      event._bubble.position.x = this._GetDatePosition(event.date).x;
      event._date_label.position.x = event._bubble.position.x;
      this.HideCollidingDates();
      $('.label-start > p').text('year ' + this._GetPositionDate(canvas.width * this._date_label_offset).toStringType(this._date_type));
      $('.label-end > p').text('year ' + this._GetPositionDate(canvas.width - canvas.width * this._date_label_offset).toStringType(this._date_type));
    }
    if (now - this._last_fit > 80) {
      this.FitBubbles();
      this._last_fit = now;
    }
    // reposition illustrations
    this._events.forEach(event => {
      if (event.illustration) {
        event.illustration.position = event._bubble.position;
        this._FitTexture(event);
      }
    })

    // move sprites to end of render list
    if (app.stage.children.length >= 2) {
        for (let i = app.stage.children.length - 2; i >= 0; i--) {
          if (app.stage.children[i].constructor.name == 'Sprite') {
            app.stage.children.push(app.stage.children.splice(i, 1)[0]);
        };
      }
    }

    // update minimap
    const zoom = (this.date_last.year - this.date_first.year) / (this._scroll_max.year - this._scroll_min.year) * 100 + '%';
    const left = (this.date_first.year - this._scroll_min.year) / (this._scroll_max.year - this._scroll_min.year) * 100 + '%';
    $('.minimap > .select').css({width: zoom, 'margin-left': left});

    for (let i = this._minimap_markers.length - 1; i >= 0; i--) {
      app.stage.removeChild(this._minimap_markers[i]);
      this._AddMinimapMarker(this._minimap_markers.splice(i, 1)[0].date);
    }
  }

  //
  // Add event marker top minimap
  //
  _AddMinimapMarker(date) {
    const marker = new Graphics();
    this._minimap_markers.push(marker);
    marker.date = date;
    marker.lineStyle(2, 0x595755, 1);
    let pos = $('.minimap').offset().left + 1 + ($('.minimap').outerWidth() - 2) *
    ( (date.year - this._time_start.year) / (this._time_end.year - this._time_start.year) );
    marker.moveTo(pos, $('.minimap').offset().top - 2);
    marker.lineTo(pos, $('.minimap').offset().top + $('.minimap').outerHeight() + 2);
    app.stage.addChild(marker);
  }

  /*
████████ ██ ███    ███ ███████ ██████   ██████  ██ ███    ██ ████████
   ██    ██ ████  ████ ██      ██   ██ ██    ██ ██ ████   ██    ██
   ██    ██ ██ ████ ██ █████   ██████  ██    ██ ██ ██ ██  ██    ██
   ██    ██ ██  ██  ██ ██      ██      ██    ██ ██ ██  ██ ██    ██
   ██    ██ ██      ██ ███████ ██       ██████  ██ ██   ████    ██
*/

  //
  // Add event
  //
  AddEvent(timepoint) {
    this._events.push(timepoint);

    timepoint._date_label = this._CreateLabel();

    // add bubble
    this._RenderBubble(timepoint, this._bubble_rad_max, 2);

    // set date label
    timepoint._date_label.text = timepoint.date.toStringType(this._date_type);
    timepoint._date_label.position = timepoint._bubble.position;
    timepoint._date_label.position.y = timepoint._bubble.position.y + timepoint._bubble.radius + 15;
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

    this._AddMinimapMarker(timepoint.date);
  }

  //
  // Render Bubble
  //
  _RenderBubble(event, radius, border_width, fill_color = color.fill) {
    app.stage.removeChild(event._bubble);
    event._bubble = new Graphics;
    event._bubble.lineStyle(border_width, color.line, 1);
    event._bubble.beginFill(fill_color);
    event._bubble.drawCircle(0, 0, radius);
    event._bubble.position = this._GetDatePosition(event.date);
    event._bubble.endFill();
    app.stage.addChild(event._bubble);
    event._bubble.radius = radius;
  }

  //
  // Fit Bubbles
  //
  FitBubbles() {
    // select bubbles that are inside visible area
    let events = this._events.filter(event =>
      event._bubble.position.x + event._bubble.radius > 0 &&
      event._bubble.position.x - event._bubble.radius < window.innerWidth
    );

    if (events.length == 0)
      return;
    if (events.length == 1) {
      this._RenderBubble(events[0], this._bubble_rad_max, 2)
      return;
    }

    // check minimum distance
    let dist_min = this._bubble_rad_max * 2;
    let collisions = [];
    for (let i = 1; i < events.length; i++) {
      const dist = events[i]._bubble.position.x - events[i-1]._bubble.position.x;
      //console.log(dist);
      if (dist < this._bubble_rad_min * 2) {
        if (!collisions.includes(i-1))
          collisions.push(i-1);
        collisions.push(i);
        continue;
      }
      else if (dist < dist_min) {
        dist_min = dist;
      }
    }

    // set non colliding bubbles to min distance
    events.forEach(event => {
      if (!collisions.includes(event)) {
        if (event.illustration)
          this._RenderBubble(event, dist_min / 2, 2);
        else
          this._RenderBubble(event, this._bubble_rad_min / 2, 2, color.line);
      }
    });

    // create array of colliding events
    collisions = collisions.map(e => events[e]);

    // split collisions
    const bubble_off = 40;
    if (collisions.length > 0) {
      for (let i in collisions) {
        if (collisions[i].illustration)
          this._RenderBubble(collisions[i], this._bubble_rad_min, 2);
        else
          this._RenderBubble(collisions[i], this._bubble_rad_min / 2, 2, color.line);
        collisions[i]._bubble.position.y = this._line.position.y + bubble_off * (collisions[i].illustration ? 1 : 0.8) * (i % 2 ? 1 : -1);
      }
    }

    // reposition date label
    events.forEach(event => {
      event._date_label.position.y = event._bubble.position.y +
        (event._bubble.radius + 20) * (event._bubble.position.y >= this._line.position.y - 10 ? 1 : -1);
    })

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


  /*
████████ ███████ ██   ██ ████████ ██    ██ ██████  ███████ ███████
   ██    ██       ██ ██     ██    ██    ██ ██   ██ ██      ██
   ██    █████     ███      ██    ██    ██ ██████  █████   ███████
   ██    ██       ██ ██     ██    ██    ██ ██   ██ ██           ██
   ██    ███████ ██   ██    ██     ██████  ██   ██ ███████ ███████
*/

  //
  // Load Textures
  //
  LoadTextures() {
    let illustrations = [];
    let texture_log = [];
    for (let event of this._events) {
      const path = 'data/illustrations/' + this._ReplaceUmlauts(event.wiki_ref.toLowerCase()) + '.png';
      if (this._FileExists(path)) {
        illustrations.push(this._ReplaceUmlauts(event.wiki_ref.toLowerCase()) + '.png');
        texture_log[path] = {status: 'ok'};
      } else
        texture_log[path] = {status: '404'};
    }
    console.table(texture_log);
    LoadTextures(illustrations, 'data/illustrations/', _ => {
      for (let texture in textures) {
        const event = this._events.find(event => this._ReplaceUmlauts(event.wiki_ref.toLowerCase()) == texture);
        event.illustration = textures[texture];
        event.illustration.visible = true;
        event.illustration.position = event._bubble.position;
        this._FitTexture(event);
      }
      this.Resize();
    })
  }

  _ReplaceUmlauts(str) {
    return str.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue');
  }

  _FitTexture(event) {
    if (event.illustration.width >= event.illustration.height)
      event.illustration.scale.set(event._bubble.width / (event.illustration.width / event.illustration.scale.x) * 0.8);
    else
      event.illustration.scale.set(event._bubble.height / (event.illustration.height / event.illustration.scale.y) * 0.8);
  }

  _FileExists(url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
  }

  /*
██    ██ ████████ ██ ██      ██ ████████ ██    ██
██    ██    ██    ██ ██      ██    ██     ██  ██
██    ██    ██    ██ ██      ██    ██      ████
██    ██    ██    ██ ██      ██    ██       ██
 ██████     ██    ██ ███████ ██    ██       ██
*/

  //
  // Hide Colliding Dates
  //
  HideCollidingDates() {
    if (this._events.length < 2)
      return;
    for (let i = 1; i < this._events.length; i++) {
      const l1 = this._events[i]._date_label;
      const l2 = this._events[i-1]._date_label;
      if (this._events[i]._bubble.position.y > this._line.position.y != this._events[i-1]._bubble.position.y > this._line.position.y) {
        l1.visible = true;
        l2.visible = true;
        console.log(this._events[i-1].name + ' & ' + this._events[i].name);
        continue
      };
      l1.visible = (l2.visible && l1.position.x - l1.width / 2 <= l2.position.x + l2.width / 2)
        ? false
        : true;
    }
  }

  //
  // Print Tabel of all events to the console
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
    // adjust position if infobox is open
    if (this._split_date) {
      if (date.year < this._split_date.year) {
        // event is to left of infobox
        pos_x = (this._split_pos - this._split_width / 2) / (this._split_date.year - this.date_first.year) * (date.year - this.date_first.year);
      } else if (date.year > this._split_date.year) {
        // to the right
        const split = this._split_pos + this._split_width / 2;
        pos_x = split + (canvas.width - split) / (this.date_last.year - this._split_date.year) * (date.year - this._split_date.year);
      } else {
        // event is infobox
        pos_x = this._split_pos;
      }
    }
    return new Point(Math.round(pos_x), Math.round(this._line.position.y));

  }

  //
  // Get Position Date
  //
  _GetPositionDate(px) {
    return new chronos.Date(px / canvas.width * (this.date_last.year - this.date_first.year) + this.date_first.year);
  }

  //
  // Create Date Label
  //
  _CreateLabel() {
    let label = new PIXI.Text('', new PIXI.TextStyle({fontFamily: "Helvetica", fontSize: 13}));
    label.anchor.set(0.5, 0.5);
    return label;
  }

  //
  // Apply margin to scroll cap
  //
  _ApplyMargin() {
    const offset_years = this._GetPositionDate(this._date_label_offset * canvas.width).year - this.date_first.year;
    this._scroll_min = new chronos.Date(this._time_start.year - offset_years);
    this._scroll_max = new chronos.Date(this._time_end.year + offset_years);
    this._min_zoom = this._scroll_max.year - this._scroll_min.year;
  }

  /*
████████ ██ ████████ ██      ███████        ██        ██ ███    ██ ███████  ██████      ██████   ██████  ██   ██
   ██    ██    ██    ██      ██             ██        ██ ████   ██ ██      ██    ██     ██   ██ ██    ██  ██ ██
   ██    ██    ██    ██      █████       ████████     ██ ██ ██  ██ █████   ██    ██     ██████  ██    ██   ███
   ██    ██    ██    ██      ██          ██  ██       ██ ██  ██ ██ ██      ██    ██     ██   ██ ██    ██  ██ ██
   ██    ██    ██    ███████ ███████     ██████       ██ ██   ████ ██       ██████      ██████   ██████  ██   ██
*/

  //
  // open title-box
  //
  _OpenTitleBox(event) {
    $(".nametag h1").html(event.name);
    $(".nametag").css("top", event._bubble.position.y - ($(".nametag").outerHeight() / 2) - 85);
    $(".nametag").css("left", event._bubble.position.x - $(".nametag").outerWidth() / 2);
    $(".nametag").show();
  }

  //
  // close title-box
  //
  _CloseTitleBox(event) {
    $(".nametag").hide();
  }

  //
  // open & close info box
  //
  _OpenInfoBox(event) {
    this._CloseTitleBox();
    $('.infobox-image').attr('src', 'https://via.placeholder.com/150')
    // set title
    $(".infobox > h1").html(event.name);
    $(".infobox > p").html("loading description...");
    $(".infobox").css({width: '100px', height: '100px'});
    let left = event._bubble.position.x - $('.infobox').outerWidth() / 2;
    let top = this._line.position.y - $('.infobox').outerHeight() / 2;
    if (left < 100)
      left = 100;
    if (left > window.innerWidth - 200)
      left = window.innerWidth - 200;
    $(".infobox").css({left: left, top: top});
    // show infobox
    $(".infobox").show();
    $('.infobox').animate({
      left: left - (300 - $('.infobox').outerWidth()) / 2,
      top: top - (300 - $('.infobox').outerHeight()) / 2,
      width: '300px',
      height: '300px'
    }, 200);

    Wiki.GetExtract(event.wiki_ref, extract => {
      $('.infobox > p').text(extract);
    });

    // load image
    const resolutions = [128, 512, 1024, 2048];
    let load_image = (i_res = 0) => {
      if (i_res >= resolutions.length) return;
      Wiki.GetImage(event.wiki_ref, resolutions[i_res], img => {
        let info_img = new Image();
        info_img.onload = _ => {
          $(info_img).addClass('infobox-image');
          $('.infobox > .infobox-image').replaceWith(info_img);
          load_image(i_res+1);
        }
        info_img.src = img;
      });
    }
    load_image();
  }

  _HideInfoBox() {
    $('.infobox').get(0).scrollTop = 0;
    $('.infobox').hide();
    $('.infobox').removeClass('infobox-extended');
    $('.infobox-image').attr('src', 'https://via.placeholder.com/150')
  }

  /*
███████ ██    ██ ███████ ███    ██ ████████ ███████
██      ██    ██ ██      ████   ██    ██    ██
█████   ██    ██ █████   ██ ██  ██    ██    ███████
██       ██  ██  ██      ██  ██ ██    ██         ██
███████   ████   ███████ ██   ████    ██    ███████ */

  //
  // Update date visibility on mouse move
  //
  MouseMove(mousepos) {
    this._CloseTitleBox();
    for (let event of this._events) {
      const dx = Math.abs(mousepos.x - event._bubble.position.x);
      // set date visibility
      event._date_label.alpha = dx < 150
        ? (150 - Math.pow(dx, 1.2)) / 150
        : 0;
      // show nametag if hover
      const dist = Math.sqrt(Math.pow(mousepos.x - event._bubble.position.x, 2) + Math.pow(mousepos.y - event._bubble.position.y, 2));
      if (dist <= event._bubble.radius)
        this._OpenTitleBox(event);
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
    } else {
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
      let scroll_adjust = this.date_first.year < this._scroll_min.year
        ? this._scroll_min.year - this.date_first.year
        : this._scroll_max.year - this.date_last.year;
      this.date_first = new chronos.Date(this.date_first.year + scroll_adjust);
      this.date_last = new chronos.Date(this.date_last.year + scroll_adjust);
    }
  }

  _GetZoomStep(speed_mult = 1) {
    return (this.date_last.year - this.date_first.year) / 400 * -speed_mult;
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
      const step = Math.pow(t, 2) / (2 * (Math.pow(t, 2) - t) + 1);

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

    if (on_done)
      setTimeout(on_done, duration);

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
      const step = Math.pow(t, 2) / (2 * (Math.pow(t, 2) - t) + 1);

      let frame_new = start_frame + (timeframe - start_frame) * step;
      let zoom_step = frame_new - frame_last;

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

    if (on_done)
      setTimeout(on_done, duration);

    }

}
