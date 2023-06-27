import * as d3 from "d3"
import { largestTriangleThreeBucket } from "d3fc-sample";
const { DateTime } = require("luxon");
const fillMissingAnnotationsAfterDownsampling = require('./FillMissingAnnotationsAfterDownsampling');


// part of package https://github.com/m-gagne/limit.js
Function.prototype.throttle = function (milliseconds, context) {
    var baseFunction = this,
        lastEventTimestamp = null,
        limit = milliseconds;

    return function () {
        var self = context || this,
            args = arguments,
            now = Date.now();

        if (!lastEventTimestamp || now - lastEventTimestamp >= limit) {
            lastEventTimestamp = now;
            baseFunction.apply(self, args);
        }
    };
};


d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
      let firstChild = this.parentNode.firstChild;
      if (firstChild) {
          this.parentNode.insertBefore(this, firstChild);
      }
  });
};

d3.selection.prototype.first = function() {
  return d3.select(this.nodes()[0]);
};

d3.selection.prototype.last = function() {
  return d3.select(this.nodes()[this.size() - 1]);
};

export function hotkeysCallbackWrapper(plottingApp) {
  return function hotkeysCallbackInner(e) {
    if (d3.event.repeat) {
      return
    }
    plottingApp.shiftKey = d3.event.shiftKey;
    const code = d3.event.key;
    if (code === 'ArrowUp') {
      // handle up arrowkey
      transformContext(0, -2, plottingApp);
      d3.event.preventDefault();
    } else if (code === 'ArrowDown') {
      // handle down arrowkey
      transformContext(0, 2, plottingApp);
      d3.event.preventDefault();
    } else if (code === 'ArrowLeft') {
      // handle left arrowkey
      if (plottingApp.shiftKey) {
        transformContext(-9, 0, plottingApp);
      } else {
        transformContext(-1, 0, plottingApp);
      }
    } else if (code === 'ArrowRight') {
      // handle right arrowkey
      if (plottingApp.shiftKey) {
        transformContext(9, 0, plottingApp);
      } else {
        transformContext(1, 0, plottingApp);
      }
    } else if (code === 'l') {
      // handle 'l' press over hoverinfo
      if (plottingApp.hoverTimer && plottingApp.hoverinfo.label) {
        if (plottingApp.selectedLabel != plottingApp.hoverinfo.label) {
          plottingApp.selectedLabel = plottingApp.hoverinfo.label;
          $("#updateSelectedLabel").click();
        }
      }
    } else if (code === 'r') {
      $("#enableReference").click();
    } else if (code === 'w') {
      // switch to the next reference series
      $.fn.nextWrap = function() {
          const $next = this.next();
          if ($next.length) return $next;
          return this.siblings().first();
      };

      $('#referenceSelect option:selected').prop('selected', false).nextWrap().prop('selected', true).trigger('change');
    } else if (code === 's') {
      // switch to the previous reference series
      $.fn.prevWrap = function() {
          const $prev = this.prev();
          if ($prev.length) return $prev;
          return this.siblings().last();
      };
      $('#referenceSelect option:selected').prop('selected', false).prevWrap().prop('selected', true).trigger('change');
    } else if (code === 'q') {
      // switch to the next active series
      $.fn.nextWrap = function() {
          const $next = this.next();
          if ($next.length) return $next;
          return this.siblings().first();
      };

      $('#seriesSelect option:selected').prop('selected', false).nextWrap().prop('selected', true).trigger('change');
    } else if (code === 'a') {
      // switch to the previous active series
      $.fn.prevWrap = function() {
          const $prev = this.prev();
          if ($prev.length) return $prev;
          return this.siblings().last();
      };
      $('#seriesSelect option:selected').prop('selected', false).prevWrap().prop('selected', true).trigger('change');
    }
  }
}


// keyboard functions to change the focus
function transformContext(shift, scale, plottingApp) {
  const scalingFactor = Math.pow(1.1, scale);

  let currentExtent = d3.brushSelection(plottingApp.plot.context_brush.node());
  currentExtent = currentExtent.map(function(d) {
    return 1*plottingApp.context_xscale.invert(d);
  });

  let offset0 = ((1 - scalingFactor) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);
  let offset1 = ((scalingFactor - 1) + 0.1 * shift) * (currentExtent[1] - currentExtent[0]);

  // don't shift past the ends of the scale
  const limits = plottingApp.context_xscale.domain().map(Number);

  // if we go off the left edge, don't allow us to move left
  if (currentExtent[0] + offset0 < limits[0]) {
    offset0 = limits[0] - currentExtent[0];
    offset1 = offset0 + (scalingFactor - 1) * (currentExtent[1] - currentExtent[0]);
  }

  // if we go off the right edge, don't allow us to move right
  if (currentExtent[1] + offset1 > limits[1]) {
    offset1 = limits[1] - currentExtent[1];
    offset0 = offset1 + (1 - scalingFactor) * (currentExtent[1] - currentExtent[0]);
  }

  // double check that the last bit didn't push us too far left
  if (currentExtent[0] + offset0 < limits[0]) {
    offset0 = limits[0] - currentExtent[0];
  }

  // do nothing if the context does not change
  if (offset0 === 0 && offset1 === 0) {
    return
  }

  let newExtent = [currentExtent[0] + offset0, currentExtent[1] + offset1];

  // do shift and update brushing
  updateHoverinfo("", "", "", plottingApp);
  plottingApp.plot.context_brush.call(plottingApp.context_brush.move,
    newExtent.map(function(d) { return plottingApp.context_xscale(d); }));

  // re color points
  updateSelection(plottingApp);
}

/* update hoverbox info with point data */
function updateHoverinfo(time, val, label, plottingApp) {
  if (time === "" || val === "") {
    $("#hoverinfo").hide();
    plottingApp.hoverinfo.time = "";
    plottingApp.hoverinfo.val = "";
    plottingApp.hoverinfo.label = "";
    $("#updateHover").click();
  } else {
    $("#hoverinfo").show();
    plottingApp.hoverinfo.time = formatHover(time);
    plottingApp.hoverinfo.val = val.toFixed(5);
    plottingApp.hoverinfo.label = label;
    $("#updateHover").click();
  }
}


function updateSelection(plottingApp) {
  plottingApp.main.selectAll(".point")
    .attr("style", function(d) { return getPointStyle(d, plottingApp) });
  plottingApp.context.selectAll(".point")
    .attr("style", function(d) { return getPointStyle(d, plottingApp) });
}


/* return the css style string for point based on label->color mapping */
function getPointStyle(d, plottingApp) {
  if (d.label !== '') {
    const color = plottingApp.labelList.find(l => l.name === d.label).color;
    return "fill: " + color + "; stroke: " + color + "; opacity: 0.75;"
  } else {
    return "fill: black; stroke: none; opacity: 1;"
  }
}


/* format luxon datetime obj to hoverbox time */
function formatHover(datetime) {
  return datetime.toISO().split("+")[0].replace("T", " ").replace("Z", "");
}


export function drawLabeler(plottingApp) {
  //margins
  plottingApp.maindiv_width = $("#maindiv").width();
  plottingApp.main_margin = {top: 10, right: 120, bottom: 100, left: 90};
  plottingApp.width = plottingApp.maindiv_width - plottingApp.main_margin.left - plottingApp.main_margin.right;
  plottingApp.height = 610;
  plottingApp.main_height = plottingApp.height - plottingApp.main_margin.top - plottingApp.main_margin.bottom;
  plottingApp.context_margin = {top: (plottingApp.height - 70), right: 140, bottom: 20, left: 90};
  plottingApp.context_height = plottingApp.height - plottingApp.context_margin.top - plottingApp.context_margin.bottom;
  plottingApp.label_margin = {small: 10, large: 20};

  //scales
  plottingApp.main_xscale = d3.scaleTime().range([0, plottingApp.width]);
  plottingApp.context_xscale = d3.scaleTime().range([0, plottingApp.width]);
  plottingApp.main_yscale = d3.scaleLinear().range([plottingApp.main_height, 0]);
  plottingApp.secondary_yscale = d3.scaleLinear().range([plottingApp.main_height, 0]);
  plottingApp.context_yscale = d3.scaleLinear().range([plottingApp.context_height, 0]);

  //axes
  //can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
  plottingApp.main_xaxis = d3.axisBottom(plottingApp.main_xscale);
  plottingApp.context_xaxis = d3.axisBottom(plottingApp.context_xscale);
  plottingApp.y_axis = d3.axisLeft(plottingApp.main_yscale).tickFormat(d3.format(".2e"));
  plottingApp.ref_axis = d3.axisRight(plottingApp.secondary_yscale).tickFormat(d3.format(".2e"));

  const viewBox_width = plottingApp.width + plottingApp.main_margin.left + plottingApp.main_margin.right;
  const viewBox_height = plottingApp.main_height + plottingApp.main_margin.top + plottingApp.main_margin.bottom;

  //plotting areas
  plottingApp.svg = d3.select("#maindiv").append("svg")
  .classed("container-fluid", true)
  .classed("mainChart", true)
  .attr("id", "mainChart")
  .attr("width", viewBox_width)
  .attr("height", viewBox_height + 50)
  .attr("viewBox", "0 0 " + viewBox_width + " " + viewBox_height)
  .attr("preserveAspectRatio", "xMinYMid meet");

  d3.select("#maindiv")
  .insert("text", "#mainChart")
  .attr("id", "chartTitle")
  .attr("class", "chartText")
  .attr("x", (plottingApp.width / 2))
  .attr("y", 0)
  .style("padding-left", "3.57%")
  .style("font-size", "20px")
  .attr("viewBox", "0 0 " + viewBox_width + " " + viewBox_height)
  .attr("preserveAspectRatio", "xMinYMid meet");

  // set instrSelect top margin
  $("#instrSelect").css("margin-top", viewBox_height + 50);
  $("#rSelectSeriesToAnnotate").hide()

  const maxFileNameLength = 70;
  const truncatedFilename = plottingApp.filename.length < maxFileNameLength ? plottingApp.filename : (plottingApp.filename.substring(0, maxFileNameLength) + "...")
  plottingApp.svg.append("text")
  .text("Filename: " + truncatedFilename)
  .attr("class", "chartText")
  .attr("transform", "translate(" + plottingApp.main_margin.left + "," + (-plottingApp.label_margin.small) + ")");

  plottingApp.maxPointsInMainPlot = 4320; // 12 hours in 0.1 Hz sampling
  plottingApp.maxPointsInContextPlot = plottingApp.maxPointsInMainPlot / 3;
  plottingApp.svg.append("text")
  .attr("id", "downsampleWarning")
  .text("Warning! Active series downsampled to " + plottingApp.maxPointsInMainPlot + " points")
  .attr("class", "chartText").style("fill", "red").style("text-anchor", "middle")
  .attr("transform", "translate(" + (plottingApp.maindiv_width / 2)  + "," + plottingApp.label_margin.small + ")")
  .style("visibility", "hidden");

  // create clipPath for svg elements (prevents svg elements outside the main window)
  plottingApp.svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", plottingApp.width)
  .attr("height", plottingApp.main_height);

  // main window
  plottingApp.main = plottingApp.svg.append("g")
  .attr("class", "main")
  .attr("transform", "translate(" + plottingApp.main_margin.left + "," + plottingApp.main_margin.top + ")");

  // smaller context window
  plottingApp.context = plottingApp.svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + plottingApp.context_margin.left + "," + plottingApp.context_margin.top + ")");

  // d3 brushes
  plottingApp.main_brush = d3.brush()
  .extent([[0,0], [plottingApp.width, plottingApp.main_height]])
  .on("end", brushedMain);

  plottingApp.main_brushX = d3.brushX()
  .extent([[0,0], [plottingApp.width, plottingApp.main_height]])
  .on("end", brushedMain);

  // disable default d3 brush key modifiers
  plottingApp.main_brush.keyModifiers(false)
  plottingApp.main_brushX.keyModifiers(false)

  plottingApp.context_brush = d3.brushX()
  .extent([[0,0],[plottingApp.width, plottingApp.context_height]])
  .on("brush", brushedContext);

  // d3 lines
  plottingApp.main_line = d3.line()
  .curve(d3.curveStepAfter)
  .x(function(d) { return plottingApp.main_xscale(d.time); })
  .y(function(d) { return plottingApp.main_yscale(d.val); });

  plottingApp.secondary_line = d3.line()
  .curve(d3.curveStepAfter)
  .x(function(d) { return plottingApp.main_xscale(d.time); })
  .y(function(d) { return plottingApp.secondary_yscale(d.val); });

  plottingApp.context_line = d3.line()
  .curve(d3.curveStepAfter)
  .x(function(d) { return plottingApp.context_xscale(d.time); })
  .y(function(d) { return plottingApp.context_yscale(d.val); });

  // load data format and brushes
  plottingApp.shiftKey = false;
  plottingApp.brushSelector = "Invert";
  plottingApp.selectedSeries = $("#seriesSelect option:selected").val();
  plottingApp.refSeries = $("#referenceSelect option:selected").val();
  plottingApp.annotateMultiple = false;
  plottingApp.annotateIn2D = false;
  // plot namespace (for svg selections associated with d3 objects)
  plottingApp.plot = {};

  // series bounds & hoverinfo dict
  plottingApp.currentYAxisBounds = {};
  plottingApp.globalYAxisBounds = {};

  plottingApp.splitYAxis = false;
  plottingApp.splitActiveYAxisBounds = {};
  plottingApp.splitRefYAxisBounds = {};

  plottingApp.hoverinfo = {};

  $(function () {
   init();
  });

  /* initialize plots with default series data */
  function init() {
    plottingApp.allData = plottingApp.allData.map(reformatTime);

    const labelValuesFromData = getLabelValuesFromData();
    const labelValuesFromStorage = getLabelValuesFromStorage();

    // initialize or reload session
    if (localStorage.getItem('filename') !== plottingApp.filename ||
        labelValuesFromStorage.length !== labelValuesFromData.length) {
      console.log('Starting a new session for a file: ' + plottingApp.filename);
      localStorage.setItem('filename', plottingApp.filename);
      localStorage.setItem('labelList', JSON.stringify(plottingApp.labelList));
      setLabelValuesInStorage(labelValuesFromData);
    } else if (JSON.stringify(labelValuesFromStorage) !== JSON.stringify(labelValuesFromData)) {
      console.log('Loading session for a file: ' + plottingApp.filename);
      setLabelValuesInData(labelValuesFromStorage);

      // reload label list and refresh label selector
      const storageLabelList = JSON.parse(localStorage.getItem('labelList'));
      plottingApp.labelList = storageLabelList.map(({ name }) => name);
      plottingApp.handleLabelSelector();

      // reload original color ordering
      for (let i = 0; i < storageLabelList.length; i++) {
        plottingApp.labelList[i].color = storageLabelList[i].color;
      }

      plottingApp.openReloadSession();
    }

    plottingApp.updateSeriesSelector();
    plottingApp.main_data = plottingApp.allData.filter(d => d.series === plottingApp.selectedSeries);
    plottingApp.ref_data = plottingApp.main_data

    // populate series bounds
    const unique_series = [... new Set(plottingApp.allData.map(d => d.series))];
    for (const series of unique_series) {
        const bounds = getMinMaxForSeries(series);
        plottingApp.currentYAxisBounds[series] = bounds;
        plottingApp.globalYAxisBounds[series] = bounds;
        const globalYAxisRange = bounds[1] - bounds[0];
        plottingApp.splitActiveYAxisBounds[series] = [bounds[0] - globalYAxisRange, bounds[1]];
        plottingApp.splitRefYAxisBounds[series] = [bounds[0], bounds[1] + globalYAxisRange];
    }

    // get default focus
    let defaultExtent = getDefaultExtent();
    // set scales based on loaded data, default focus
    plottingApp.context_xscale.domain(padExtent(d3.extent(
      plottingApp.allData.map(d => d.time)))); // xaxis set according to allData

    defaultExtent[0] = plottingApp.context_xscale.domain()[0];
    plottingApp.main_xscale.domain(defaultExtent);

    // Initialize downsampler for big datasets
    plottingApp.sampler = largestTriangleThreeBucket();
    // Configure the x / y value accessors
    plottingApp.sampler.x(d => d.time).y(d => d.val);

    initPlot(defaultExtent);
    updateActiveYAxis();  // no need to updateReferenceYAxis as main == ref
    updateContextPlot();
    updateMainPlot();

    // color points
    updateSelection(plottingApp);

    // remove loading bar
    $(".loader").css("display", "none");
  }

  /* initialize plot brushes, axes to default extent */
  function initPlot(defaultExtent) {
    // create context and main x axes
    plottingApp.main.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + plottingApp.main_height + ")")
    .call(plottingApp.main_xaxis);

    plottingApp.context.append("g")
      .attr("transform", "translate(0," + plottingApp.context_height + ")")
      .attr("class", "x axis")
      .call(plottingApp.context_xaxis);

    // create main and context brushes
    plottingApp.plot.main_brush = plottingApp.main.append("g")
    .attr("class", "main_brush")
    .on("pointerenter pointermove", plottingApp.pointermoved.throttle(100))
    .on("pointerleave", plottingApp.pointerleave)
    .call(plottingApp.main_brushX);

    plottingApp.plot.context_brush = plottingApp.context.append("g")
    .attr("class", "context_brush")
    .call(plottingApp.context_brush);

    // move brushes to back
    plottingApp.plot.main_brush.moveToBack();
    plottingApp.plot.context_brush.moveToBack();

    // disable click selection clear on context brush

    // store the reference to the original handler
    let oldMousedown = plottingApp.plot.context_brush.on("mousedown.brush");

    // and replace it with our custom handler
    plottingApp.plot.context_brush.on("mousedown.brush", function () {
        plottingApp.plot.context_brush.on("mouseup.brush", function () {
            clearHandlers();
        });

        plottingApp.plot.context_brush.on("mousemove.brush", function () {
            clearHandlers();
            oldMousedown.call(this);
        });

        function clearHandlers() {
            plottingApp.plot.context_brush.on("mousemove.brush", null);
            plottingApp.plot.context_brush.on("mouseup.brush", null);
        }
    });

    // set context brush to default extent
    plottingApp.plot.context_brush.call(plottingApp.context_brush.move,
      defaultExtent.map(plottingApp.context_xscale));
  }

  function plotContext() {
    plottingApp.context_data = fillAnnotatedMainData(plottingApp.context_data);

    // if context line already exists, delete it
    if (plottingApp.plot.context_line) {
      plottingApp.plot.context_line.remove();
    }

    //context plot
    plottingApp.plot.context_line = plottingApp.context.append("path")
    .datum(plottingApp.context_data)
    .attr("class", "d3line")
    .attr("d", plottingApp.context_line)
    .moveToBack();

    plottingApp.context_points = plottingApp.context.selectAll(".point")
    .data(plottingApp.context_data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.context_xscale(d.time); })
    .attr("cy", function(d) { return plottingApp.context_yscale(d.val); })
    .attr("pointer-events", "none")
    .attr("fill-opacity", "0.7")
    .attr("r", 2);
  }

  function inSelectedTimeRange(d){
    const [low, high] = plottingApp.main_xscale.domain();
    return low <= d.time & d.time <= high
  }

  /* update yaxes bounds based on selected and reference series */
  function updateYAxis() {
    updateActiveYAxis();
    updateReferenceYAxis();
  }

  function updateActiveYAxis() {
    // Set y-axis ranges
    if (plottingApp.splitYAxis && plottingApp.selectedSeries !== plottingApp.refSeries) {
      plottingApp.main_yscale.domain(plottingApp.splitActiveYAxisBounds[plottingApp.selectedSeries]);
    } else {
      plottingApp.main_yscale.domain(plottingApp.currentYAxisBounds[plottingApp.selectedSeries]);
    }
    plottingApp.context_yscale.domain(plottingApp.globalYAxisBounds[plottingApp.selectedSeries]);

    // redraw / draw primary y axis
    if (plottingApp.plot.y_axis) {
      plottingApp.plot.y_axis.remove();
    }

    plottingApp.plot.y_axis = plottingApp.main.append("g")
    .attr("class", "y axis primary")
    .call(plottingApp.y_axis)
    .call(g => g.select(".domain").remove());

    // add primary y axis label
    const axisBox = plottingApp.plot.y_axis.node().getBBox();
    plottingApp.main.select(".y.axis.primary").append("text")
    .attr("class", "y label primary")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - axisBox.width - plottingApp.label_margin.small)
    .attr("x", 0 - plottingApp.main_height / 2)
    .attr("fill", "currentColor")
    .text(plottingApp.selectedSeries)
    .style("font-size", "16px");

    // handle editable primary y axis
    let p_editBtn = plottingApp.main.select(".y.axis.primary").append("g")
    .attr("class", "button y primary editBtn")
    .attr("transform", "translate(" + (0 - axisBox.width - plottingApp.label_margin.small) + ",0)");

    p_editBtn.append("rect")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "0.75px")
    .attr("width", "28px")
    .attr("height", "16px")
    .attr("transform", "translate(-22, -8)");

    p_editBtn.append("text")
    .text("Edit")
    .attr("dy", "0.32em")
    .attr("cursor", "pointer")
    .attr("fill", "currentColor")
    .on("click", function(d, i) { return editYAxis(plottingApp.selectedSeries); });

    let p_autoBtn = plottingApp.main.select(".y.axis.primary").append("g")
    .attr("class", "button y primary editBtn")
    .attr("transform", "translate(" + (0 - axisBox.width - plottingApp.label_margin.small) + ",30)");

    p_autoBtn.append("rect")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "0.75px")
    .attr("width", "28px")
    .attr("height", "16px")
    .attr("transform", "translate(-22, -8)");

    p_autoBtn.append("text")
    .text("Auto")
    .attr("dx", "0.32em")
    .attr("dy", "0.32em")
    .attr("cursor", "pointer")
    .attr("fill", "currentColor")
    .on("click", function(d, i) {
      plottingApp.splitYAxis = false;
      plottingApp.currentYAxisBounds[plottingApp.selectedSeries] = plottingApp.globalYAxisBounds[plottingApp.selectedSeries];
      updateActiveYAxis();
      updateMainPlot();
    });


    let p_localBtn = plottingApp.main.select(".y.axis.primary").append("g")
    .attr("class", "button y primary editBtn")
    .attr("transform", "translate(" + (0 - axisBox.width - plottingApp.label_margin.small) + ",60)");

    p_localBtn.append("rect")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "0.75px")
    .attr("width", "28px")
    .attr("height", "16px")
    .attr("transform", "translate(-22, -8)");

    p_localBtn.append("text")
    .text("Local")
    .attr("dx", "0.32em")
    .attr("dy", "0.32em")
    .attr("cursor", "pointer")
    .attr("fill", "currentColor")
    .on("click", function(d, i) {
        plottingApp.splitYAxis = false;
        plottingApp.currentYAxisBounds[plottingApp.selectedSeries] = getMinMax(plottingApp.main_data.filter(inSelectedTimeRange).map(d => d.val));
        updateActiveYAxis();
        updateMainPlot();
      });
  }


  function updateReferenceYAxis() {

    // handle redraw reference y axis
    if (plottingApp.plot.ref_axis) {
      plottingApp.plot.ref_axis.remove();
    }

    // handle ref series
    if (plottingApp.refSeries !== "" && plottingApp.selectedSeries !== plottingApp.refSeries) {
      // Select y-axis range
      if (plottingApp.splitYAxis) {
        plottingApp.secondary_yscale.domain(plottingApp.splitRefYAxisBounds[plottingApp.refSeries]);
      } else {
        plottingApp.secondary_yscale.domain(plottingApp.currentYAxisBounds[plottingApp.refSeries]);
      }

      plottingApp.plot.ref_axis = plottingApp.main.append("g")
      .attr("class", "y axis secondary")
      .attr("transform", "translate(" + plottingApp.width + ",0)")
      .call(plottingApp.ref_axis)
      .call(g => g.select(".domain").remove());

      // add reference y axis label
      const axisBox = plottingApp.plot.ref_axis.node().getBBox();
      plottingApp.main.select(".y.axis.secondary").append("text")
          .attr("class", "y label secondary")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", axisBox.width + plottingApp.label_margin.large)
          .attr("x", 0 - plottingApp.main_height / 2)
          .attr("fill", "currentColor")
          .text(plottingApp.refSeries)
          .style("font-size", "16px");

      // handle editable y-axis for reference series
      let r_editBtn = plottingApp.main.select(".y.axis.secondary").append("g")
      .attr("class", "button y secondary editBtn")
      .attr("transform", "translate(" + (axisBox.width + plottingApp.label_margin.small) + ",0)");

      r_editBtn.append("rect")
      .attr("stroke", "currentColor")
      .attr("stroke-width", "0.75px")
      .attr("width", "28px")
      .attr("height", "16px")
      .attr("transform", "translate(-3, -8)");

      r_editBtn.append("text")
      .text("Edit")
      .attr("dy", "0.32em")
      .attr("cursor", "pointer")
      .attr("fill", "currentColor")
      .on("click", function(d, i) { return editYAxis(plottingApp.refSeries); });

      let r_autoBtn = plottingApp.main.select(".y.axis.secondary").append("g")
      .attr("class", "button y secondary editBtn")
      .attr("transform", "translate(" + (axisBox.width + plottingApp.label_margin.small) + ",30)");

      r_autoBtn.append("rect")
      .attr("stroke", "currentColor")
      .attr("stroke-width", "0.75px")
      .attr("width", "28px")
      .attr("height", "16px")
      .attr("transform", "translate(-3, -8)");

      r_autoBtn.append("text")
      .text("Auto")
      .attr("dy", "0.32em")
      .attr("cursor", "pointer")
      .attr("fill", "currentColor")
      .on("click", function(d, i) {
        plottingApp.splitYAxis = false;
        plottingApp.currentYAxisBounds[plottingApp.refSeries] = plottingApp.globalYAxisBounds[plottingApp.refSeries];
        $("#triggerReplotReference").click();
      });

      let r_localBtn = plottingApp.main.select(".y.axis.secondary").append("g")
      .attr("class", "button y secondary editBtn")
      .attr("transform", "translate(" + (axisBox.width + plottingApp.label_margin.small) + ",60)");

      r_localBtn.append("rect")
      .attr("stroke", "currentColor")
      .attr("stroke-width", "0.75px")
      .attr("width", "28px")
      .attr("height", "16px")
      .attr("transform", "translate(-3, -8)");

      r_localBtn.append("text")
      .text("Local")
      .attr("dy", "0.32em")
      .attr("cursor", "pointer")
      .attr("fill", "currentColor")
      .on("click", function(d, i) {
        plottingApp.splitYAxis = false;
        plottingApp.currentYAxisBounds[plottingApp.refSeries] = getMinMax(plottingApp.ref_data.filter(inSelectedTimeRange).map(d => d.val));
        $("#triggerReplotReference").click();
      });

      let r_splitBtn = plottingApp.main.select(".y.axis.secondary").append("g")
      .attr("class", "button y secondary editBtn")
      .attr("transform", "translate(" + (axisBox.width + plottingApp.label_margin.small) + ",90)");

      r_splitBtn.append("rect")
      .attr("stroke", "currentColor")
      .attr("stroke-width", "0.75px")
      .attr("width", "28px")
      .attr("height", "16px")
      .attr("transform", "translate(-3, -8)");

      r_splitBtn.append("text")
      .text("Split")
      .attr("dy", "0.32em")
      .attr("cursor", "pointer")
      .attr("fill", "currentColor")
      .on("click", function(d, i) {
        plottingApp.splitYAxis = true;
        updateYAxis();
        updateMainPlot();
      });
    }
  }


  /* redraw main graph with new points and color them */
  function updateMainPlot() {
    let mainData = plottingApp.main_data.filter(inSelectedTimeRange);

    if (mainData.length > plottingApp.maxPointsInMainPlot) {
      d3.select("#downsampleWarning").style("visibility", "visible")
      mainData = fillMissingAnnotationsAfterDownsampling(downsampleData(mainData, plottingApp.maxPointsInMainPlot), mainData.filter(d => d.label !== ''));
    } else {
      d3.select("#downsampleWarning").style("visibility", "hidden")
    }

    // handles ref series
    let secondaryData = null;
    if (plottingApp.refSeries !== "" && plottingApp.refSeries !== plottingApp.selectedSeries) {
        secondaryData = plottingApp.ref_data.filter(inSelectedTimeRange);
        if (secondaryData.length > plottingApp.maxPointsInMainPlot) {
          secondaryData = fillMissingAnnotationsAfterDownsampling(downsampleData(secondaryData, plottingApp.maxPointsInMainPlot), secondaryData.filter(d => d.label !== ''));
        }
    }

    const totalData = secondaryData ? [...mainData, ...secondaryData] : mainData;

    // redraw path
    let path = plottingApp.main.selectAll("path");
    path.remove();

    // add primary series data line
    plottingApp.main.append("path")
      .datum(mainData)
      .attr("class", "d3line")
      .attr("stroke-opacity", "0.5")
      .attr("d", plottingApp.main_line);

    // redraw points
    let point = plottingApp.main.selectAll("circle").data(totalData);

    point.join("circle")
    .attr("class", "point")
    .attr("cx", function(d) { return plottingApp.main_xscale(d.time); })
    .attr("cy", function(d) { return selectYScale(d); })
    .attr("r", 4);

    // add secondary line and update secondary point styling if there is reference
    if (secondaryData) {
      plottingApp.main.append("path")
        .datum(secondaryData)
        .attr("class","d3line")
        .attr("id", "secondary_line")
        .attr("stroke-opacity", "0.4")
        .attr("d", plottingApp.secondary_line)
        .moveToBack();

      plottingApp.main.selectAll(".point")
      .filter((d, i) => d.series === plottingApp.refSeries)
      .attr("fill-opacity", "0.4")
      .attr("r", 2)
      .attr("pointer-events", "none")
      .moveToBack();
    }

    /* add hover and click-label functionality for primary series points */
    plottingApp.main.selectAll(".point")
    .filter((d, i) => d.series === plottingApp.selectedSeries)
    .moveToFront()
    .attr("fill-opacity", "0.7")
    .attr("pointer-events", "all")
    .on("click", function(point){
          //allow clicking on single points
          toggleSelected(point);
          updateContextPlot();
          updateSelection(plottingApp);
          updateHoverinfo(point.actual_time, point.val, point.label, plottingApp);
          updateLocalStorage();
        });

    toggleHoverinfo();
    updateSelection(plottingApp);

    // update xAxis svg element
    plottingApp.main.select(".x.axis").call(plottingApp.main_xaxis);
  }

  /* toggle label of point using selected label */
  function toggleSelected(point) {
    if (point.label !== plottingApp.selectedLabel) {
      point.label = plottingApp.selectedLabel;
    } else {
      point.label = '';
    }
  }

  /* replot svg after changing series */
  function fullReplot() {
    updateYAxis();
    updateContextPlot();
    updateMainPlot();
  }

  function downsampleData(data, num) {
    // Configure the size of the buckets used to downsample the data.
    // Have at most 'num' context points
    const bucketSize = Math.max(Math.round(data.length / num), 1);
    if (bucketSize === 1) {
      return data
    }

    plottingApp.sampler.bucketSize(bucketSize);

    return plottingApp.sampler(data);
  }

  function updateContextPlot() {
    plottingApp.context_data = downsampleData(plottingApp.main_data, plottingApp.maxPointsInContextPlot);
    plotContext();
  }

  function fillAnnotatedMainData(data) {
    return fillMissingAnnotationsAfterDownsampling(data, plottingApp.main_data.filter(d => d.label !== ''));
  }

  function brushedMain() {
    const extent = d3.brushSelection(plottingApp.plot.main_brush.node());
    if (extent === null) {
      return;
    }

    let data_has_changed;
    if (plottingApp.annotateIn2D) {
      // convert pixels defining brush into actual times
      const xmin = plottingApp.main_xscale.invert(extent[0][0]),
            xmax = plottingApp.main_xscale.invert(extent[1][0]),
            ymax = plottingApp.main_yscale.invert(extent[0][1]),
            ymin = plottingApp.main_yscale.invert(extent[1][1]);
      data_has_changed = updateBrushedDataXY(xmin, ymin, xmax, ymax);
    } else {
      const xmin = plottingApp.main_xscale.invert(extent[0]),
            xmax = plottingApp.main_xscale.invert(extent[1]);
      data_has_changed = updateBrushedDataX(xmin, xmax);
    }

    if (data_has_changed) {
      updateContextPlot();
      updateSelection(plottingApp);
      updateLocalStorage();
    }

    if (plottingApp.annotateIn2D) {
      plottingApp.plot.main_brush.call(plottingApp.main_brush.move, null);
    } else {
      plottingApp.plot.main_brush.call(plottingApp.main_brushX.move, null);
    }
  }

  function brushedContext() {
    const s = d3.brushSelection(plottingApp.plot.context_brush.node());
    if (s === null) {
      return;
    }
    plottingApp.main_xscale.domain(s.map(plottingApp.context_xscale.invert, plottingApp.context_xscale));
    updateMainPlot();
  }

  // Find the nodes within the specified X-axis range.
  function updateBrushedDataX(brush_xmin, brush_xmax) {
    let dataToAnnotate;
    if (plottingApp.annotateMultiple) {
      dataToAnnotate = plottingApp.allData.filter(d => plottingApp.seriesToAnnotate.includes(d.series));
    } else {
      dataToAnnotate = plottingApp.main_data
    }

    const brushValue =  plottingApp.shiftKey ? '' : plottingApp.selectedLabel;
    return dataToAnnotate.filter(d => (d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.label !== brushValue))
                         .map(function (d) { d.label = brushValue; })
                         .length > 0; // return true if there were any changes
  }

  // Find the nodes within the specified rectangle.
  function updateBrushedDataXY(brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
    const brushValue =  plottingApp.shiftKey ? '' : plottingApp.selectedLabel;
    return plottingApp.main_data.filter(d => (d.time >= brush_xmin) && (d.time <= brush_xmax) && (d.val >= brush_ymin) && (d.val <= brush_ymax) && (d.label !== brushValue))
                                .map(function (d) { d.label = brushValue; })
                                .length > 0; // return true if there were any changes
  }

  function toggleHoverinfo() {
    // enable mouseover hoverinfo
    plottingApp.main.selectAll(".point")
        .on("mouseover", function (point) {
            updateHoverinfo(point.actual_time, point.val, point.label, plottingApp);
        })
    }

  plottingApp.pointermoved = function pointermoved(event) {
    const [cursorX, cursorY] = d3.mouse(plottingApp.plot.main_brush.node());
    const cursorXInvert = plottingApp.main_xscale.invert(cursorX);
    const cursorAbsoluteDate = DateTime.fromJSDate(cursorXInvert);

    if (plottingApp.annotateIn2D) {
      const cursorAbsoluteValue = plottingApp.main_yscale.invert(cursorY);
      updateHoverinfo(cursorAbsoluteDate, cursorAbsoluteValue, "", plottingApp);
    }
    else {
      let i = d3.bisectRight(plottingApp.main_data.map(x => x.time.ts), cursorAbsoluteDate.ts);
      if (i >= plottingApp.main_data.length) {
        i -= 1;
      }
      const point = plottingApp.main_data[i];
      updateHoverinfo(cursorAbsoluteDate, point.val, point.label, plottingApp);}
  }

  plottingApp.pointerleave = function pointerleave() {
    updateHoverinfo("", "", "", plottingApp);
  }

  function reformatTime(d) {
    d.actual_time = d.time; // preserve the original times with offset for proper exporting
    d.time = DateTime.fromISO(d.time.toISO({ includeOffset: false }));
    return d;
  }

  function runLengthEncode(array) {
    let encoded = [];
    let previous, count, i;

    for (count = 1, previous = array[0], i = 1; i < array.length; i++) {
      if (array[i] !== previous) {
        encoded.push(count, previous);
        count = 1;
        previous = array[i];
      } else {
        count++;
      }
    }
    encoded.push(count, previous);

    return encoded;
  }

  function runLengthDecode(encoded) {
    let decoded = [];

    for (let i = 0; i < encoded.length; i = i + 2) {
      decoded = decoded.concat(Array(encoded[i]).fill(encoded[i + 1]));
    }

    return decoded;
  }

  /* get label values from the data */
  function getLabelValuesFromData() {
    return plottingApp.allData.map(({ label }) => label);
  }

  /* get label values from the LocalStorage */
  function getLabelValuesFromStorage() {
    const labelValues = localStorage.getItem('labelValues');
    if (labelValues === null) {
      return null
    }
    return runLengthDecode(JSON.parse(labelValues));
  }

  /* set label values in the data */
  function setLabelValuesInData(labelValues) {
    for (let i = 0; i < labelValues.length; i++) {
      plottingApp.allData[i].label = labelValues[i];
    }
  }

   /* set label values in the LocalStorage */
  function setLabelValuesInStorage(labelValues) {
    localStorage.setItem('labelValues', JSON.stringify(runLengthEncode(labelValues)));
  }

  /* update LocalStorage with current state */
  function updateLocalStorage() {
    setLabelValuesInStorage(getLabelValuesFromData());
    localStorage.setItem('labelList', JSON.stringify(plottingApp.labelList));
    plottingApp.updateSeriesSelector();
  }

  function setReference() {
    plottingApp.refSeries = $("#referenceSelect option:selected").val();
    plottingApp.ref_data = plottingApp.allData.filter(d => d.series === plottingApp.refSeries);
    $('#enableReference').prop("checked", true);
    $("#triggerReplotReference").click();
  }

  /* return appropriate yscale applied to val of d
     based on whether primary or reference series */
  function selectYScale(d) {
    if (d.series === plottingApp.selectedSeries) {
      return plottingApp.main_yscale(d.val)
    }
    if (d.series === plottingApp.refSeries) {
      return plottingApp.secondary_yscale(d.val)
    }
  }

  /* increase extent by padding */
  function padExtent(extent, padding) {
    padding = (typeof padding === "undefined") ? 0.01 : padding;
    const range = extent[1] - extent[0];
    const margin = (range === 0 ? padding : padding * range);
    // 1*x is quick hack to handle date/time axes
    return [(1 * extent[0]) - margin, (1 * extent[1]) + margin];
  }

  /* manually update main Y axis with user input */
  function editYAxis(axis) {
    // handle dynamic data
    plottingApp.editSeries = axis;
    $("#updateEdit").click();
  }

  /* calculate default extent based on data length */
  function getDefaultExtent() {
    const start_date = plottingApp.main_data[0].time;
    const end_index = Math.min(Math.round((plottingApp.main_data.length - 1) / 10), 10000)
    const end_date = plottingApp.main_data[end_index].time;
    return [start_date, end_date]
  }

  function getMin(arr) {
    let len = arr.length;
    let min = Infinity;

    while (len--) {
        min = arr[len] < min ? arr[len] : min;
    }
    return min;
  }

  function getMax(arr) {
    let len = arr.length;
    let max = -Infinity;

    while (len--) {
        max = arr[len] > max ? arr[len] : max;
    }
    return max;
  }

  /* return the bounds of the given series */
  function getMinMaxForSeries(series) {
    let y_vals;
    // Try to avoid redundant filtration of allData
    if (series === plottingApp.selectedSeries) {
      y_vals = plottingApp.main_data.map(d => d.val);
    } else if (series === plottingApp.refSeries) {
      y_vals = plottingApp.ref_data.map(d => d.val);
    } else {
      y_vals = plottingApp.allData.filter(d => d.series === series).map(d => d.val);
    }
    return getMinMax(y_vals);
  }

  function getMinMax(vals) {
    const minMax = [getMin(vals), getMax(vals)];
    return padExtent(minMax, 0.05);
  }


  $("#seriesSelect").change(function() {
    plottingApp.selectedSeries = $("#seriesSelect option:selected").val();

    if (!$('#enableReference').prop("checked")) {
      // prevent enabling reference series
      plottingApp.refSeries = plottingApp.selectedSeries
    }

    plottingApp.main_data = plottingApp.allData.filter(d => d.series === plottingApp.selectedSeries);
    fullReplot();
  });

  $("#referenceSelect").change(function() {
    setReference();
  })

  $("#labelSelect").change(function() {
    plottingApp.selectedLabel = $("#labelSelect option:selected").attr("name");
  });

  $("#clearLabels").click(function() {
    plottingApp.allData.map(function (d) {
      d.label = '';
    })
    updateSelection(plottingApp);
  });

  $("#triggerReplot").click(function() {
    fullReplot();
   });

  $("#triggerReplotReference").click(function() {
    updateReferenceYAxis();
    updateMainPlot();
   });

  $("#triggerRecolor").click(function() {
    updateSelection(plottingApp);
   });

  $("#export").click(function() {
    let csvContent = plottingApp.headerStr + "\n";

    plottingApp.allData.forEach(function(dataArray){
      let date = dataArray.actual_time.toISO();
      let row = dataArray.series + "," + date
                + "," + dataArray.val + "," + dataArray.label;
      csvContent += row + "\n";
    });
    let saveData = (function () {
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            let string = csvContent,
                blob = new Blob([string], {type: "text/csv, charset=UTF-8"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    let filename = plottingApp.filename;
    const labeledSuffix = "-labeled-";
    const currentDate = new Date(Date.now());
    const currentDateString = currentDate.toISOString()
    if (!filename.includes(labeledSuffix)) {
      filename += labeledSuffix + currentDateString;
    } else {
      filename = filename.substring(0, filename.length - currentDateString.length) + currentDateString;
    }
    saveData(csvContent, filename + ".csv");
    localStorage.clear();
    $("#exportComplete").show();
  });

  d3.select("#maindiv").on("wheel", function(e) {
    if (d3.event.wheelDelta > 0) {
      transformContext(0, -1, plottingApp);
    } else {
      transformContext(0, 1, plottingApp);
    }
  });

  d3.select(window).on("keydown", hotkeysCallbackWrapper(plottingApp));

  d3.select(window).on("keyup", function() {
    plottingApp.shiftKey = d3.event.shiftKey;
  });
}
