// save current event index
let current = 0;

// handle click event to start timeline
function HandleStartJourney (timeline) {
  $("#start-journey").click(function () {
    let total = timeline._events.length
    if (current === 0) {
      timeline.ZoomTo(6018, 900);
    }
    if (current < total) {
      NextStep(timeline, this);
    } else {
      current = 0;
      $(".infobox").hide();
      $(this).html("start journey");
    }
  })
}

// go to next step in journey
function NextStep (timeline, el) {
  timeline._CloseTitleBox();
  timeline.ScrollTo(timeline._events[current].date, 700, function () {
      let total = timeline._events.length
      let currentText = current+1
      if (current >= 0 && current < total) {
        $(el).html("next event " + currentText + " of " + total);
        timeline._OpenTitleBox(timeline._events[current]);
        timeline._OpenInfoBox(timeline._events[current]);
        if (current+1 === total) {
          $(el).html("finish journey");
        }
        current++;
      } else {
        timeline._OpenTitleBox(timeline._events[current]);
        timeline._OpenInfoBox(timeline._events[current]);
      }

  });
}
export {HandleStartJourney};
