var bubble, country, createBubbleChart, createBubbleMap, createBubbles, processData, updateBubbleChart, updateBubbleMap, updateBubbles;

country = "United States";

bubble = {
  bubble: null,
  map: null,
  sums: {},
  scale: null
};

processData = function() {
  var c_ob, country, main, main_ob, mini, sum, val, _ref, _ref2, _results;
  _ref = data.working;
  _results = [];
  for (country in _ref) {
    c_ob = _ref[country];
    sum = 0;
    _ref2 = c_ob.job_types;
    for (main in _ref2) {
      main_ob = _ref2[main];
      for (mini in main_ob) {
        val = main_ob[mini];
        sum += val;
      }
    }
    bubble.sums[country] = sum;
    _results.push(bubble.max = d3.max([bubble.max, sum]));
  }
  return _results;
};

createBubbleChart = function() {
  processData();
  bubble.scale = d3.scale.log().domain([1, bubble.max]).range(["#FFFFFF", "red"]);
  createBubbleMap();
  return createBubbles();
};

createBubbleMap = function() {
  var feature, fishPolygon, i, refish, size, _i, _len, _ref, _results;
  size = $("#bubblemap").parent().width();
  bubble.map = d3.select("#bubblemap").append("svg").attr("height", size * 0.7).attr("width", size);
  bubble.map.projection = d3.geo.mercator().scale(size).translate([size / 2, size / 2]);
  bubble.map.path = d3.geo.path().projection(bubble.map.projection);
  bubble.map.fisheye = d3.fisheye().radius(50).power(10);
  feature = bubble.map.selectAll("path").data(data.countries.features).enter().append("path").attr("class", function(d) {
    if (d.properties.name in data.working) {
      return "unselected country";
    } else {
      return "feature country";
    }
  }).attr("fill", function(d) {
    if (d.properties.name in data.working) {
      if (d.properties.name === country) {
        return 'black';
      } else {
        return bubble.scale(bubble.sums[country]);
      }
    } else {
      return 'white';
    }
  }).attr("d", bubble.map.path).each(function(d) {
    return d.org = d.geometry.coordinates;
  }).on('click', function(d, i) {
    var clicked;
    clicked = d.properties.name;
    if (!(clicked in data.working)) return;
    country = clicked;
    route.navigate("#/bubble/" + country);
    return updateBubbleChart();
  });
  feature.each(function(d, i) {
    var c, p, t;
    c = d.properties.name;
    t = "" + c + " <br />";
    p = bubble.sums[c] ? bubble.sums[c] : 0;
    t += "" + p + " projects completed";
    return $(this).tooltip({
      title: t,
      space: 70
    });
  });
  fishPolygon = function(polygon) {
    return _.map(polygon, function(list) {
      return _.map(list, function(tuple) {
        var c, p;
        p = bubble.map.projection(tuple);
        c = bubble.map.fisheye({
          x: p[0],
          y: p[1]
        });
        return bubble.map.projection.invert([c.x, c.y]);
      });
    });
  };
  refish = function(e) {
    var currentElement, m, totalOffsetX, totalOffsetY, x, y;
    x = e.offsetX;
    y = e.offsetY;
    m = $("bubblechart > svg").offset();
    if (!(x != null)) {
      totalOffsetX = 0;
      totalOffsetY = 0;
      currentElement = this;
      while (true) {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
        if ((currentElement = currentElement.offsetParent)) break;
      }
      x = e.pageX - totalOffsetX;
      y = e.pageY - totalOffsetY;
    }
    bubble.map.fisheye.center([x, y]);
    return bubble.map.selectAll("path").attr("d", function(d) {
      var clone, processed, type;
      clone = $.extend({}, d);
      type = clone.geometry.type;
      processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
      clone.geometry.coordinates = processed;
      return bubble.map.path(clone);
    });
  };
  _ref = ["mousemove", "mousein", "mouseout", "touch", "touchmove"];
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    i = _ref[_i];
    _results.push($("#bubblemap").on(i, refish));
  }
  return _results;
};

createBubbles = function() {
  var box, c, cats, h, i, t, w, _len, _results;
  w = $("#bubblechart").parent().width();
  h = $("#bubblemap").height() * 3;
  bubble.bubble = d3.select("#bubblechart").append("svg").attr("width", w).attr("height", h).attr("class", "pack").append("g").attr("transform", "translate(0,0)");
  bubble.width = w;
  bubble.height = h;
  bubble.colors = d3.scale.category20().domain(categories);
  bubble.flatten = function(root) {
    var classes, recurse;
    classes = [];
    recurse = function(name, node) {
      if (node.children) {
        return node.children.forEach(function(child) {
          return recurse(node.name, child);
        });
      } else {
        return classes.push({
          packageName: name,
          className: node.name,
          value: node.size
        });
      }
    };
    recurse(null, root);
    return {
      children: classes,
      className: "Total"
    };
  };
  cats = $("#cats");
  _results = [];
  for (i = 0, _len = categories.length; i < _len; i++) {
    t = categories[i];
    c = $("<div>");
    box = $("<div>").css({
      height: 10,
      width: 10,
      display: "inline-block",
      "white-space": "pre-line",
      "background-color": bubble.colors(t),
      "margin-right": "10px"
    });
    c.text(t).prepend(box);
    _results.push(cats.append(c));
  }
  return _results;
};

updateBubbleChart = function(c) {
  if (c) country = c;
  $("#bubble-title").text("Breakdown of Projects for " + country);
  updateBubbleMap();
  return updateBubbles();
};

updateBubbleMap = function() {
  var feature;
  return feature = bubble.map.selectAll("path").attr("fill", function(d) {
    if (d.properties.name in data.working) {
      if (d.properties.name === country) {
        return '#168CE5';
      } else {
        return bubble.scale(bubble.sums[d.properties.name]);
      }
    } else {
      return 'white';
    }
  });
};

updateBubbles = function() {
  var big_name, big_ob, children, d, f, format, g, grandchildren, i, node, packer, s, small_name, small_size, sum, sums, timing, v;
  d = data.working[country].job_types;
  f = {
    name: "jobs"
  };
  children = [];
  sums = {};
  for (big_name in d) {
    big_ob = d[big_name];
    grandchildren = [];
    sum = 0;
    for (small_name in big_ob) {
      small_size = big_ob[small_name];
      grandchildren.push({
        "name": small_name,
        "size": small_size
      });
      sum += small_size;
    }
    children.push({
      "name": big_name,
      "children": grandchildren.sort(function(a, b) {
        return a.size < b.size;
      })
    });
    sums[big_name] = sum;
  }
  f.children = children.sort(function(a, b) {
    return sums[a.name] < sums[b.name];
  });
  format = d3.format(",d");
  packer = d3.layout.pack().sort(null).size([bubble.width, bubble.height]).value(function(d) {
    return d.value;
  });
  timing = 100;
  node = bubble.bubble.selectAll("g.node").data(packer.nodes(bubble.flatten(f)), function(d) {
    return d.className;
  });
  g = node.enter().append("g").attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
  g.append("circle");
  g.filter(function(d) {
    return !d.children;
  }).append("text");
  g.each(function(d, i) {
    return $(this).tooltip({
      title: "",
      placement: 'middle'
    });
  });
  node.transition().delay(timing).attr("class", function(d) {
    if (d.children != null) {
      return "node";
    } else {
      return "leaf node";
    }
  }).attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
  node.select("circle").transition().delay(timing).attr("r", function(d) {
    return d.r;
  }).attr("fill", function(d) {
    if (d.packageName) {
      return bubble.colors(d.packageName);
    } else {
      return "none";
    }
  });
  node.filter(function(d) {
    return !d.children;
  }).select("text").transition().delay(timing).attr("text-anchor", "middle").attr("dy", ".3em").text(function(d) {
    return d.className.substring(0, d.r / 4);
  });
  node.exit().remove();
  s = d3.sum((function() {
    var _results;
    _results = [];
    for (i in sums) {
      v = sums[i];
      _results.push(v);
    }
    return _results;
  })());
  node.each(function(d, i) {
    var t;
    t = "" + d.className + " <br /> " + d.value + " projects completed <br />      " + (Math.round(100 * d.value / s)) + "% of total projects completed";
    return $(this).attr('data-original-title', t).tooltip('fixTitle');
  });
  return $("#bubble-projects").text("Total projects completed: " + s);
};
