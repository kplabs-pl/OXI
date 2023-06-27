<template>
  <BaseView class="container-fluid" id="plotBox">
    <template v-slot:navbar-content>
      <h1 class="navbar-brand"><div class="homeLink" @click="routeHandler().newHome()"><span id="OXI">O X I</span> time series tool by
        <img src="/static/files/kplabs-logo-white.svg" height="35" width="124" class="logo white-logo ls-is-cached lazyloaded" alt="KP Labs">
      </div>
      </h1>
      <ul class="navbar-nav ml-auto">
        <div class="nav-link" @click="routeHandler().newHelp()">Help</div>
        <li class="nav-item">
          <div class="nav-link" id="clear" @click="modalHandler().openClear()">Clear</div>
        </li>
        <div class="nav-link" id="export" @click="modalHandler().openExport()">Export</div>
      </ul>
    </template>
    <template v-slot:main-content>
      <div id="hoverbox">
        <div id="hoverinfo" class="card chartText" style="display: none;">
          <div class="card-subtitle">Time: {{ hoverinfo.time }}</div>
          <div class="card-subtitle">Value: {{ hoverinfo.val }}</div>
          <div class="card-subtitle">Label: {{ hoverinfo.label }}</div>
        </div>
      </div>
      <div id="maindiv"></div>

      <div id="instrSelect">
        <div id="leftInstr">
            <div class="row">
              <div class="col" id="leftInstr">
                <strong>How to label points</strong></br>
                <strong>Click</strong> a point to toggle it as labeled</br>
                <strong>Click & Drag</strong> over a selection of points to label them</br>
                <strong><kbd>SHIFT</kbd> + Click & Drag </strong> over a selection of points to unlabel them</br>
              </div>
            </div>
        </div>
        <div id="rightInstr">
          <div class="row">
            <div class="col" id="rightInstr">
              <strong>How to navigate the graph</strong></br>
              <kbd>→</kbd> or <kbd>←</kbd> : pan</br>
              <kbd>SHIFT</kbd> + <kbd>→</kbd> or <kbd>←</kbd> : fast pan</br>
              <kbd>↑</kbd> or <kbd>↓</kbd> or <kbd>mouse wheel</kbd>: zoom</br>
              <kbd>Q</kbd> / <kbd>A</kbd> : next/prev active series</br>
              <kbd>W</kbd> / <kbd>S</kbd> : next/prev reference series</br>
              <strong>Click & Drag</strong> the bottom context bar to adjust focus region</br>
            </div>
          </div>
        </div>
        <div id="selectors">
          <div class="row">
            <div id="labelSelector">
              <div id="lSelect" style="padding-bottom: 10px;">
                Label:
                <div id="lBox">
                  <button type="button" class="close" style="margin-right: 5px; float: left;" @click="modalHandler().openAddLabel()">
                    <span>&plus;</span>
                  </button>
                  <select id="labelSelect" v-model="selectedLabel" :style="{'color': getLabelColor(selectedLabel)}" @change="updateSeriesSelector()">
                    <option v-for="label in optionsList" :key="label.name" :name="label.name" :style="{'color': label.color}">
                      {{ label.name }}
                    </option>
                  </select>
                  <button type="button" id="deleteLabel" class="close" style="margin-left: 5px;" v-visible="deleteValid" @click="modalHandler().openDeleteLabel()">
                    <span>&times;</span>
                  </button>
                </div>
              </div>
              <div id="rAnnotateMultiple" style="float: left;">
                Annotate multiple series: <input type="checkbox" id="annotateMultiple" @change="enableAnnotateMultiple()">
              </div>
              <div id="rSelectSeriesToAnnotate">
                <vue-multi-select
                  v-model="seriesToAnnotate"
                  search
                  historyButton
                  @open="disableHotkeys"
                  @close="enableHotkeys"
                  :filters="seriesToAnnotateFilters"
                  :options="seriesToAnnotateOptions"
                  :position="seriesToAnnotatePosition"
                  :btnLabel="seriesToAnnotateSelectorText"
                  :selectOptions="seriesToAnnotateData"/>
              </div>
              <div id="rAnnotateIn2D">
                Annotate in 2D: <input type="checkbox" id="annotateIn2D" @change="enableAnnotateIn2D()">
              </div>
            </div>
            <div class="col" id="leftInstr">
              <div id="selector">
                <div id="seriesSelector" style="float: right;">
                  <div id="pSeries">
                    Active series: <select id="seriesSelect" style="float: right;"></select>
                  </div>
                  <div id="rSeries">
                    Reference series: <select id="referenceSelect" style="float: right;"></select>
                  </div>
                  <div id="rSeriesEnable" style="float: right;">
                    Enable reference (press <kbd>R</kbd>): <input type="checkbox" id="enableReference" @change="enableReference()" Checked>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LabelerModal id="modal" ref="modalComponent" @clicked-ok="modalOk" @closed="postModalClose" :modal-name="modal.name" :modal-header="modal.header">
        <template v-slot:content>
          <template v-if="modal.name == 'edit'">
            <input type="text" class="bounds" id="lowBounds" v-model="axisBounds[0]"/>
            -
            <input type="text" class="bounds" id="highBounds" v-model="axisBounds[1]"/>
          </template>
          <template v-else-if="modal.name == 'clear'">
            All labels from all series will be erased. This cannot be undone.
          </template>
          <template v-else-if="modal.name.includes('failed')">
            {{ modal.failMessage }}
          </template>
          <template v-else-if="modal.name == 'export'">
            Load new data set or continue labeling this one?
          </template>
          <template v-else-if="modal.name == 'delete'">
            Are you sure you want to delete label: {{ selectedLabel }}
          </template>
          <template v-else-if="modal.name == 'add'">
            <input type="text" id="inputLabel" v-model="inputLabel"/>
          </template>
        </template>
      </LabelerModal>

      <!-- invisible buttons to get from vue scope to labeler() -->
      <button id="updateHover" style="display: none;" @click="updateHoverinfo()"></button>
      <button id="updateEdit" style="display: none;" @click="modalHandler().openEdit()"></button>
      <button id="updateSelectedLabel" style="display: none;" @click="updateSelectedLabel()"></button>
      <button id="triggerReplot" style="display: none;"></button>
      <button id="triggerReplotReference" style="display: none;"></button>
      <button id="triggerRecolor" style="display: none;"></button>
      <button id="clearLabels" style="display: none;"></button>
    </template>
  </BaseView>
</template>

<script>
import * as d3 from "d3";
import * as LabelerD3 from "@/assets/js/LabelerD3.js"
import colorMixin from "@/mixins/LabelerColor.js"
import LabelerModal from "@/components/LabelerModal"
import LabelerInstruction from "@/components/LabelerInstruction"
import vueMultiSelect from 'vue-multi-select';
import 'vue-multi-select/dist/lib/vue-multi-select.css';

// plotting app namespace
let plottingApp = {};

export default {
  name: "labeler",
  components: {
    LabelerModal,
    LabelerInstruction,
    vueMultiSelect,
  },
  mixins: [colorMixin],
  props: {
    allData: Array,
    filename: String,
    headerStr: String,
    seriesList: Array,
    labelList: Array,
    isValid: Boolean,
    truncated: Number,
    error_str: String,
  },
  data: function() {
    return {
      hoverinfo: {
        val: "",
        time: "",
        label: "",
      },
      modal: {
        name: "",
        header: "",
        failMessage: ""
      },
      selectedLabel: "",
      inputLabel: "",
      axisBounds: [],
      optionsList: [],

      seriesToAnnotateSelectorText: values => 'Annotate ' + values.length + " series",
      seriesToAnnotate: [],
      seriesToAnnotateData: this.seriesList,
      seriesToAnnotateFilters: [{
        nameAll: 'Select all',
        nameNotAll: 'Deselect all',
        func() {
          return true;
        },
      }],
      seriesToAnnotatePosition: 'top-right',
      seriesToAnnotateOptions: {
        multi: true,
        cssSelected: option => (option.selected ? { 'background-color': '#002B64', 'color': 'white' } : ''),
      },
    };
  },
  mounted: function() {
    if (this.isValid) {
      plottingApp.filename = this.filename;
      plottingApp.headerStr = this.headerStr;
      plottingApp.allData = this.allData;
      plottingApp.seriesList = this.seriesList;
      plottingApp.seriesToAnnotate = this.seriesToAnnotate;
      plottingApp.labelList = this.labelList;
      $("#maindiv").append("<div class=\"loader\"></div>");

      // populate selectors
      this.handleSeriesSelector();
      this.handleLabelSelector();
      plottingApp.handleLabelSelector = this.handleLabelSelector;
      plottingApp.updateSeriesSelector = this.updateSeriesSelector;
      plottingApp.changeBrush = this.changeBrush;
      plottingApp.openReloadSession = this.modalHandler().openReloadSession;

      LabelerD3.drawLabeler(plottingApp);

      if (this.truncated > 0) {
        this.modalHandler().openTruncate(this.truncated);
      }
    } else if (this.filename === "invalid") {
      $("#clear").hide();
      $("#export").hide();
      $("#hoverbox").hide();
      this.modalHandler().openUploadFailed(this.error_str);
    } else {
      this.routeHandler().goHome();
    }
  },
  watch: {
    // propagate selectedLabel to plottingApp
    selectedLabel: function(newLabel, oldLabel) {
      plottingApp.selectedLabel = newLabel;
    },
    seriesToAnnotate: function(newSeries, oldSeries) {
      plottingApp.seriesToAnnotate = newSeries;
    }
  },
  computed: {
    // determines if delete button should be visible
    deleteValid: function() {
      return !(this.optionsList.length === 1)
    }
  },
  methods: {
    disableHotkeys: function() {
      d3.select(window).on("keydown", undefined);
    },
    enableHotkeys: function() {
      d3.select(window).on("keydown", LabelerD3.hotkeysCallbackWrapper(plottingApp));
    },
    // return to Index.vue
    routeHandler: function() {
      let self = this;
      return {
        // push home to vue router
        goHome: function() {
          let routeData = self.$router.resolve({ name: "home", params: {nextUp: false} });
          window.location.href = routeData.href;
        },
        // push home with new upload to vue router
        newUpload: function() {
          let routeData = self.$router.resolve({ name: "home", params: {nextUp: true} });
          window.location.href = routeData.href;
        },
        // open Index.vue in new window
        newHome: function() {
          let routeData = self.$router.resolve({ name: "home", params: {nextUp: false} });
          window.open(routeData.href, "_blank");
        },
        // open Help.vue in new window
        newHelp: function() {
          let routeData = self.$router.resolve({ name: "help" });
          window.open(routeData.href, "_blank");
        },
      }
    },
    modalHandler: function() {
      let self = this;
      this.disableHotkeys();
      return {
        openClear: function() {
          self.modal.name = "clear";
          self.modal.header = "Clear all labels?";
          self.$refs.modalComponent.show();
        },
        openEdit: function() {
          self.axisBounds = plottingApp.currentYAxisBounds[plottingApp.editSeries].slice(0);
          self.modal.name = "edit";
          self.modal.header = "Edit Axis Bounds";
          self.$refs.modalComponent.show();
        },
        openExport: function() {
          self.modal.name = "export";
          self.modal.header = "Export complete";
          self.$refs.modalComponent.show();
        },
        openTruncate: function(truncate) {
          self.modal.name = "truncate_failed";
          self.modal.header = "Data truncated";
          self.modal.failMessage = `File was truncated to ${truncate} rows. Make sure your file contains less than ${truncate} rows! It will also be truncated on export!`;
          self.$refs.modalComponent.show();
        },
        openDeleteLabel: function() {
          self.modal.name = "delete";
          self.modal.header = "Delete label?";
          self.$refs.modalComponent.show();
        },
        openAddLabel: function() {
          self.modal.name = "add";
          self.modal.header = "Add label";
          self.$refs.modalComponent.show();
        },
        openUploadFailed: function(error_str) {
          self.modal.name = "upload_failed";
          self.modal.header = "Loading Failed";
          self.modal.failMessage = "Make sure data is in proper format. Error: \n" + error_str;
          self.$refs.modalComponent.show();
        },
        openAxisFailed: function() {
          self.modal.name = "axis_failed";
          self.modal.header = "Invalid Bounds";
          self.modal.failMessage = "Input bounds are invalid.";
          self.$refs.modalComponent.show();
        },
        openLabelFailed: function() {
          self.modal.name = "label_failed";
          self.modal.header = "Invalid Label";
          self.modal.failMessage = "Label cannot be an empty string";
          self.$refs.modalComponent.show();
        },
        openLabelExistsFailed: function() {
          self.modal.name = "label_failed";
          self.modal.header = "Invalid Label";
          self.modal.failMessage = "Label already exists.";
          self.$refs.modalComponent.show();
        },
        openReloadSession: function() {
          self.modal.name = "reload_session";
          self.modal.header = "Your local session has been reloaded";
          self.$refs.modalComponent.show();
        }
      }
    },
    // update #hoverinfo data
    updateHoverinfo() {
      this.hoverinfo.time = plottingApp.hoverinfo.time;
      this.hoverinfo.val = plottingApp.hoverinfo.val;
      this.hoverinfo.label = plottingApp.hoverinfo.label;
    },
    // update selected label with plottingApp.selectedLabel
    updateSelectedLabel() {
      this.selectedLabel = plottingApp.selectedLabel;
    },
    // return index in sorted labelList to add item
    searchLabelList(array, item) {
      if (array[0]["name"] > item) {
        return 0
      }
      let i = 1;
      while (i < array.length && !(array[i]["name"] > item && array[i-1]["name"] <= item)) {
          i = i + 1;
      }
      return i;
    },
    // determine the color of the label
    getLabelColor(label) {
      if (this.optionsList.length === 0) {
        return "black";
      }
      const labelIndex = this.searchLabelList(this.optionsList, label) - 1;
      return this.optionsList[labelIndex].color;
    },
    // add label in correct spot and handle delete button
    addLabel() {
      const inputIndex = this.searchLabelList(this.optionsList, this.inputLabel);
      this.optionsList.splice(inputIndex, 0, this.mapToColor(this.inputLabel));
      this.selectedLabel = this.optionsList[inputIndex].name;
    },
    // remove label
    removeLabel() {
      let toDelete = $("#labelSelect option:selected").attr("name"),
      delIndex = this.optionsList.map(l => l.name).indexOf(toDelete);
      if (delIndex !== -1) {
        let deleted = this.optionsList.splice(delIndex, 1)[0];
        this.deleteColor(deleted.color);
        // remove label from plottingApp.allData
        plottingApp.allData.filter(d => d.label === deleted.name).map(d => d.label = "");
        this.selectedLabel = this.optionsList[0].name;
        $("#triggerRecolor").click();
      } else {
        alert("failed to remove");
      }
    },
    // validate axis bounds
    validBounds(bounds) {
      return !isNaN(bounds[0]) && !isNaN(bounds[1]) && bounds[0] < bounds[1];
    },
    // validate label
    validLabel(label) {
      return label.length > 0 && !this.containsLabel(label)
    },
    containsLabel(label) {
      for (let key in this.optionsList) {
        let labelObj = this.optionsList[key];
        if (labelObj.name == label) {
          return true
        }
      }
      return false
    },
    // handle modal post-close actions (for failed popup modal)
    postModalClose(modal_name) {
      this.enableHotkeys();
      if (this.renderModal == "failed_axis") {
        this.$nextTick(() => this.modalHandler().openAxisFailed());
      } else if (this.renderModal == "failed_label") {
        this.$nextTick(() => this.modalHandler().openLabelFailed());
      } else if (this.renderModal == "failed_label_exists") {
        this.$nextTick(() => this.modalHandler().openLabelExistsFailed());
      } else if (this.renderModal == "reload_session") {
        this.$nextTick(() => this.modalHandler().openReloadSession());
      }
      this.renderModal = "";
    },
    // handle modal ok click
    modalOk(modal_name) {
      if (modal_name == "clear") {
        $("#clearLabels").click();
      } else if (modal_name == "export") {
        this.routeHandler().newUpload();
      } else if (modal_name == "upload_failed") {
        this.routeHandler().goHome();
      } else if (modal_name == "delete") {
        this.removeLabel();
      } else if (modal_name == "edit") {
        // check validity of axisBounds
        if (this.validBounds(this.axisBounds)) {
          plottingApp.currentYAxisBounds[plottingApp.editSeries] = this.axisBounds.slice(0);
          if (plottingApp.selectedSeries === plottingApp.editSeries) {
            $("#triggerReplot").click();
          } else {
            $("#triggerReplotReference").click();
          }
        } else {
          this.renderModal = "failed_axis";
        }
      } else if (modal_name == "add") {
        // check validity of inputLabel
        this.inputLabel = this.inputLabel.trim()  // avoid any trailing\leading whitespaces in labels
        if (this.validLabel(this.inputLabel)) {
          this.addLabel();
        } else  {
          if (this.containsLabel(this.inputLabel)) {
            this.renderModal = "failed_label_exists";
          } else {
            this.renderModal = "failed_label";
          }
        }
      }
    },
    // map label to unique color
    mapToColor(label) {
      let color = this.generateNextColor();
      return {name: label, color: color};
    },
    // remove color from used colors
    deleteColor(color) {
      this.setUnusedColor(color)
    },
    // build series selector using seriesList
    handleSeriesSelector() {
      // populate series selector
      $.each(plottingApp.seriesList, function(i, p) {
        $("#seriesSelect").append($("<option></option>").val(p).html(p));
        $("#referenceSelect").append($("<option></option>").val(p).html(p));
      });
      // if there's only one series, omit selectors
      if (plottingApp.seriesList.length === 1) {
        $("#pSeries").hide();
        $("#rSeries").hide();
        $("#rSeriesEnable").hide();
        $("#seriesSelect").hide();
        $("#referenceSelect").hide();
        $("#labelSelector").css("margin-right", "0px");
        $("#rAnnotateMultiple").hide();
      }

      // set hoverinfo right margin
      // TODO: MOVE HOVERINFO OVER

    },
    updateSeriesSelector() {
        let options = $('#seriesSelect').find('option');
        let refOptions = $('#referenceSelect').find('option');

        let labelledSeries = new Set(plottingApp.allData.filter(l => l.label === this.selectedLabel).map(l => l.series));
        let selectedColor = this.getLabelColor(this.selectedLabel)

        $.each(options, function(i, opt){
          const styleColor = labelledSeries.has(opt.text) ? selectedColor : "black";
          $(opt).css("color", styleColor);
          refOptions.eq(i).css("color", styleColor);
        });
    },
    handleLabelSelector() {
      // if there are no labels, use label_1
      if (plottingApp.labelList.length === 0) {
        plottingApp.labelList.push("anomaly");
      }

      this.optionsList = plottingApp.labelList.map(l => this.mapToColor(l));
      plottingApp.labelList = this.optionsList;
      this.selectedLabel = this.optionsList[0].name;
    },
    enableReference() {
      if (!$('#enableReference').prop("checked")) {
        plottingApp.refSeries = plottingApp.selectedSeries;
      } else {
        plottingApp.refSeries = $("#referenceSelect option:selected").val();
      }
      $("#triggerReplotReference").click();
    },
    changeBrush () {
      if (plottingApp.annotateIn2D) {
        plottingApp.plot.main_brush.remove();
        plottingApp.plot.main_brush = plottingApp.main.append("g")
          .attr("class", "main_brush")
          .on("pointerenter pointermove", plottingApp.pointermoved.throttle(100))
          .on("pointerleave", plottingApp.pointerleave)
          .call(plottingApp.main_brush);
        plottingApp.plot.main_brush.moveToBack();
        $("g.main_brush rect").css("cursor", "crosshair");
      } else {
        plottingApp.plot.main_brush.remove();
        plottingApp.plot.main_brush = plottingApp.main.append("g")
          .attr("class", "main_brush")
          .on("pointerenter pointermove", plottingApp.pointermoved.throttle(100))
          .on("pointerleave", plottingApp.pointerleave)
          .call(plottingApp.main_brushX);
        plottingApp.plot.main_brush.moveToBack();
        $("g.main_brush rect").css("cursor", "col-resize");
      }
    },
    enableAnnotateIn2D () {
      // enable a proper brush depending on the selected option
      plottingApp.annotateIn2D = $('#annotateIn2D').prop("checked");
      plottingApp.changeBrush();
    },
    enableAnnotateMultiple() {
      plottingApp.annotateMultiple = $('#annotateMultiple').prop("checked");

      // enable a proper brush depending on the selected option
      if (plottingApp.annotateMultiple) {
        // prevent annotation in 2D when annotating multiple series
        $("#rAnnotateIn2D").hide();
        if (plottingApp.annotateIn2D) {  // change brush only if different from currently selected brush 2D
          plottingApp.annotateIn2D = false;
          plottingApp.changeBrush();
        }

        $("#rSelectSeriesToAnnotate").show();
      } else {
        // restore the previously selected option to annotate in 2D
        $("#rAnnotateIn2D").show();
        plottingApp.annotateIn2D = $('#annotateIn2D').prop("checked");
        if (plottingApp.annotateIn2D) { // change brush only if different from currently selected brush 1D
          plottingApp.changeBrush();
        }

        $("#rSelectSeriesToAnnotate").hide();
      }
    },
  }
};
</script>

<style>
svg {
  font: 10px sans-serif;
  display: block;
  position: absolute;
  margin: auto;
  overflow: auto;
}

g.main_brush rect {
  cursor: col-resize;
}

g.context_brush rect.overlay {
  cursor: col-resize;
}

#maindiv {
  text-align: left;
}

#instrSelect {
  display: inline-grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
}

#selectors {
  display: block;
  float: right;
  padding-right: 15px;
}

#hoverbox {
  position: relative;
  float: right;
  z-index: 5;
}

#hoverinfo {
  position: absolute;
  text-align: left;
  padding: 10px;
  padding-bottom: 0px;
  width: 260px;
  border-color: #2c3e50;
  top: 20px;
  right: 30px;
  margin-right: 80px;
}

#selector {
  padding-right: 10%;
}

#pSeries {
  padding-bottom: 10px;
}

#rSeries {
  padding-bottom: 10px;
}

#labelSelector {
  float: right;
  z-index: 1;
}

#labelSelect {
  max-width: 150px;
  text-overflow: ellipsis;
}

#lBox {
  display: inline-block;
}

#secondary_line {
  stroke: grey;
}

.editBtn:hover {
  fill: #E3E3E3;
}

.mainChart {
  display: block;
}

.area {
  fill: black;
  clip-path: url(#clip);
}

.d3line {
  fill: none;
  stroke: black;
  stroke-width: 1.5px;
  clip-path: url(#clip);
  pointer-events: none;
}

.point {
  fill: black;
  stroke: none;
  clip-path: url(#clip);
}

.axis path,
.axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}

.main_brush .extent,
.context_brush .extent {
  stroke: #fff;
  fill-opacity: .125;
  shape-rendering: crispEdges;
}

.loader {
  position: fixed;
  left: 45%;
  right: 25%;
  top: 25%;
  border: 16px solid #f3f3f3; /* Light grey */
  border-top: 16px solid #009a93; /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chartText {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

#chartTitle {
  font-size: 1.4rem !important;
}

.bounds {
  width: 40%;
}

hr {
  background: #fff;
  margin-top: 0px;
}

kbd {
    display: inline-block;
    border: 1px solid #ccc !important;
    border-radius: 4px !important;
    padding: 0.1em 0.5em;
    margin: 0 0.2em;
    box-shadow: 0 1px 0px rgba(0, 0, 0, 0.2), 0 0 0 2px #fff inset;
    background-color: #fff !important;
    font-size: 0.75em !important;
    color:black !important;
}

.logo {
  max-height: 30px;
}

#plotBox {
  color:#000;
  background-color: #fff;
  position: relative;
}

</style>

<style scoped>

html, body {
  max-width: 100% !important;
  overflow-x: hidden !important;
  overflow: hidden !important;
}
</style>
