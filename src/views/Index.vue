<template>
  <BaseView class="container">
    <template v-slot:main-content>
      <div>
        <h3 class="title">Welcome to OXI time series tool by KP Labs</h3>
        <button type="button" class="btn btn-lg btn-outline-danger upload" id="upload" @click="upload" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
          {{ uploadButtonText }}</button>
        <input type="file" id="upload-file" ref="fileInput" class="fileCheck" @change="fileCheck">
        <a id="sampleCSV" href="/static/files/sample_trainset.csv" download>Download sample CSV</a>
      </div>
      <br>
      <div><b>&#9432; This is a client-side application. Your data is not sent over the internet.</b></div>
      <br>
      <div class="info">
        <h5 class="subh">What is it?</h5>
        OXI is a graphical tool for labeling time series data. Labeling is typically used to record interesting or anomalous points in time series data. For example, if you had temperature data from a sensor mounted in the satellite, you could label points that constitute unexpected temperature drops. See <router-link v-bind:to="'/help'">Help</router-link> for more information.<br>
		<br>
        <img src="static/files/annotation.gif" alt="time series brushing and labeling animation" style="width:80%;height:40%;border: 2px solid #be9a55;" class="center"><br><br>

        <h5 class="subh">About Us</h5>
        This tool was designed by <a href="https://kplabs.space/" target="_blank">KP Labs</a>. KP Labs is a company that develops advanced solutions such as processing units (DPU, OBC with DPU), machine learning algorithms and software for edge processing on Smallsats. Its key domain is earth observation with a focus on hyperspectral data processing. The company was set up in 2016, with its headquarters in Poland. At the moment, the team of over 70 people develops products and projects for ESA, NASA and CSA. KP Labs also has its own product line called Smart Mission Ecosystem. For mission integrators and operators who need to build advanced spacecraft, the Smart Mission Ecosystem brings together the necessary hardware, software, and AI-powered algorithms for in-orbit data processing.
        <br><br>
        This tool is based on the open-source <a href="https://github.com/Geocene/trainset" target="_blank">TRAINSET</a> application by Geocene Inc. However, we significantly improved it in terms of performance and added a bunch of features for working with long multi-channel time series (such as satellite telemetry).
        <br><br><br>
        <h6 style="text-align: center;">Copyright KP Labs Sp. z o.o. © 2022</h6>
        <br>
      </div>
    </template>
  </BaseView>
</template>

<script>
const { DateTime } = require("luxon");
const papa = require('papaparse');

export default {
  name: 'index',
  data: function() {
    return {
      errorUpload: false,
      uploadButtonText: "Select or drop file here"
    }
  },
  props: {
    nextUp: Boolean
  },
  methods: {
    onDragOver(event) {
      event.preventDefault();
      event.currentTarget.classList.add('button-ondrop');
      this.uploadButtonText = "Drop the file here";
    },
    onDragLeave(event) {
      event.currentTarget.classList.remove('button-ondrop');
      this.uploadButtonText = "Select or drop file here";
    },
    onDrop(event) {
      event.preventDefault();
      document.getElementById("upload-file").files = event.dataTransfer.files;
      this.fileCheck();
    },
    // push Labeler.vue invalid landing
    error(error_string) {
      this.errorUpload = true;
      this.uploadButtonText = "Select or drop file here";
      this.$router.push({
        name: 'labeler',
        params: {
          allData: [],
          minMax: [],
          filename: "invalid",
          headerStr: "",
          isValid: false,
          error_str: error_string
        }
      });
    },
    // trigger file upload
    shouldUpload() {
      if (this.nextUp === true) {
        setTimeout(() => this.upload(), 100);
      }
    },
    upload () {
      this.$refs.fileInput.click();
    },
    // check format validity of csv
    fileCheck () {
      $("#upload").addClass('button-ondrop');
      this.uploadButtonText = "Loading...";
      window.onerror = (errorMsg, url, lineNumber) => {
        this.error(errorMsg);
      }
      const fileInput = document.getElementById("upload-file").files.item(0);
      const filename = fileInput.name.split('.csv')[0];
      const that = this;
      // const maxDataRows = 4000000;  // max without export - (even more available to parse before plotting!)
      // const maxDataRows = 3000000; // works most of the time
      const maxDataRows = 2000000;


      function onParseComplete(parsedCSV) {
        const headerStr = parsedCSV.meta.fields.toString();
        const csvData = parsedCSV.data;

        function formatName(name){
          // Change null to empty string or trim whitespaces
          return name === null ? '' : String(name).trim()
        }

        const header_fields = parsedCSV.meta.fields;
        if(JSON.stringify(header_fields.slice(1)) !== JSON.stringify(["timestamp", "value", "label"])) {
          const error_log = "invalid csv header. Must include <series_col_name>, timestamp, value, label." ;
          console.log(error_log);
          that.error(error_log);
          return;
        }

        const series_header = header_fields[0]
        let seriesList = new Set(), labelList = new Set();
        let allData = new Array(csvData.length);  // preallocate for speed

        for (let i = 0; i < csvData.length; i++) {
          const series = formatName(csvData[i][series_header]);
          const timestamp = DateTime.fromISO(csvData[i].timestamp, {setZone: true});
          const value = parseFloat(csvData[i].value);
          const label = formatName(csvData[i].label);

          const seriesMatches = series !== '';
          const timestampMatches = timestamp.isValid;
          const valueMatches = !isNaN(value);

          if (seriesMatches && timestampMatches && valueMatches) {
            seriesList.add(series);
            if (label !== '') {
              labelList.add(label);
            }
            allData[i] = {
              'val': value,
              'time': timestamp,
              'series': series,
              'label': label
            };
          } else {
            let error_log = '';
            if (!seriesMatches) {
              error_log = 'series name parse error in line ' + (i+1);
              console.log(error_log);
            } else if (!valueMatches) {
              error_log = 'value parse error in line ' + (i+1);
              console.log(error_log);
            } else {
              error_log = 'date parse error in line ' + (i+1);
              console.log(error_log);
            }
            that.error(error_log);
            break;
          }
        }

        if (allData.length === maxDataRows) {
          console.log(`Data truncated at ${maxDataRows} element`);
        }

        // if there was no error parsing csv
        if (!that.errorUpload) {
          seriesList = Array.from(seriesList);
          labelList = Array.from(labelList);
          that.$router.push({
            name: 'labeler',
            params: {
              allData: allData,
              filename: filename,
              headerStr: headerStr,
              seriesList: seriesList.sort(),
              labelList: labelList.sort(),
              isValid: true,
              truncated: allData.length === maxDataRows ? maxDataRows : 0,
            }
          });
        }
      }

      papa.parse(fileInput, {
        delimiter: ",",
        header: true,
        dynamicTyping: false,
        fastMode: true,
        skipEmptyLines: true,
        worker: true,
        complete: onParseComplete,
        preview: maxDataRows
      });

    }
  },
  created() {
    this.shouldUpload();
  }
};
</script>

<style scoped>
#upload { margin-top: 20px; border: 1px solid #009a93; background: #009a93; color: #fff; padding: 15px 60px; width: 50%; min-height: 100px; border-radius: 0px;}
#upload:hover {  background: #007e84; border-color: #007e84; color: #fff; }
.button-ondrop {  background: #007e84; border-color: #007e84; color: #fff !important; }
#upload-file { display: none; }
#upload:focus {
  box-shadow: 0 0 0 0.2rem rgb(190 154 85 / 50%) !important;
}

.subh { font-weight: 900 !important; }
.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
#sampleCSV {
  display: block;
  padding-top: 10px;
  padding-bottom: 5px;
  margin-left: 40%;
  margin-right: 40%;
}

a {
  color: #009a93;
}

</style>
