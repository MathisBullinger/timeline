export {
  Wiki
};

class Wiki {

  static GetExtract(wiki_ref, callback) {

    let query = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles='
    query += wiki_ref;
    jsonp(query, result => {
      const extract = result.query.pages[Object.keys(result.query.pages)[0]].extract;
      callback(extract);
    });

  }

  static GetImage(wiki_ref, res = 1000, callback) {
      let query = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=' + res + '&titles='
    query += wiki_ref;
    jsonp(query, result => {
      const img = result.query.pages[Object.keys(result.query.pages)[0]].thumbnail.source;
      callback(img);
    });
  }

}

function jsonp(url, callback) {
  var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.body.removeChild(script);
    callback(data);
  };

  var script = document.createElement('script');
  script.src = url + (
    url.indexOf('?') >= 0
    ? '&'
    : '?') + 'callback=' + callbackName;
  document.body.appendChild(script);
}
