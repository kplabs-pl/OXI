<template>
  <BaseView class="container">
    <template v-slot:main-content>
    	<div class="info">
  	    <h5 class="text-uppercase text-left subh">Input data format</h5>
  	    <p class='text-left'>OXI only accepts specific file formats. This <a href="/static/files/sample_trainset.csv" download>sample CSV</a> is formatted correctly. It contains data from 3 series (series_a, series_b, series_c) labelled with 3 different label IDs (foo, bar, biz)</p>
		<br>
		<p class='text-left'>Files loaded to OXI must have four comma-delimited columms with the header: <code>series_column_name, timestamp, value, label</code>. Each row represents a single sample from a specific series.</p>

  	    <div class='text-left'>
  		    <ul style="list-style-type:square;">
  				<li><code>series_column_name</code> column should contain the name of the series to which the data point belongs. Series column name can be any string.</li>
  				<li><code>timestamp</code> is a timestamp in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO8601 format</a>. For example <code>2019-03-13T21:11:29+00:00</code> or <code>2019-03-13T21:11:29Z</code>.</li>
  				<li><code>value</code> is a numeric scalar representing the signal value.</li>
  				<li><code>label</code> column should contain string which represents the label of the data sample. It should be NULL (empty string) if there is no label associated with the data point. There can be only one label per data point.</li>
  		    </ul>
  		  </div><br>

        <div class='text-left'>
  		    <ul style="list-style-type:square;">
          <li><b>Failure to properly format your data will cause loading error.</b></li>
          <li>This is a client-side application. <b>Your data is not sent over the internet.</b></li>
          <li>Avoid loading files larger than 2 million rows. It will cause in file truncation. File will be opened but limited to 2M rows. Exporting will be also reduced to 2M rows.</li>
          <li>The maximum number of points visualized per series in 4320 (12 hours for 0.1 Hz). If the number is larger, the series is downsampled and a proper warning is displayed.</li>
		  <li>Best performance is acquired for files without quoted ("") fields</li>
		</ul>
  		  </div><br>

  	    <h5 class="text-uppercase text-left subh">Annotating and navigating</h5>
  	    <p class='text-left mb-5'>Annotating is the act of applying labels to your time series data. Labels can be toggled by clicking on points, or many labels can be applied at once by "brushing" (clicking and dragging) over many points. Navigation of the time series is accomplished either with shortcut keys or by highlighting a "focus region" on the "context bar" underneath the plot. The focus region can be brushed onto the context bar, dragged, and resized with the mouse or with shortcut keys. A legend of available shortcut keys is shown below the plot to help you navigate the time series and apply labels. It is possible to annotate multiple series at once, however, each point can have only one label assigned.</p>

        <h5 class="text-uppercase text-left subh">Restoring a previous session</h5>
        <p class='text-left mb-5'>Your annotations from a previous session are autosaved after each change and will be restored after loading the file again. Hence, <b>you will not lose your work if you accidentally close and reload the page.</b></p>

  	    <h5 class="text-left text-uppercase subh">Exporting</h5>
  	    <p class='text-left mb-5'>After you finish annotating, you can export your data. An export will download a CSV to your default downloads folder. The name of this CSV will have the suffix <code>-labeled-&lt;time&gt;</code> with the time of the export.</p>

    	</div>
  	</template>
  </BaseView>
</template>

<style scoped>
	a {
		color: #009a93;
	}
	code {
		font-family: OpenSans, monospace;
		color: #be9a55;
	}
</style>
