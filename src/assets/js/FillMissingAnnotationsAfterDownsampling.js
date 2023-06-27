function fillMissingAnnotationsAfterDownsampling(downsampled_data, all_labels) {
/**
 * Fill the downsampled data (with time and label properties), so each missing annotated fragment of the original
 * series has at least one representative point in the output series. If there is more than one point in the missing
 * annotated fragment the middle value is taken. The function assumes that both downsampled_data and all_labels are
 * sorted according to timestamps and all timestamps of all_labels lay inside the range of timestamps of
 * downsampled_data (it is fulfilled when using largestTriangleThreeBucket algorithm).
 *
 * @param {Array} downsampled_data - The array of records with time and label properties, downsampled with the
 *                                   largestTriangleThreeBucket algorithm.
 * @param {Array} all_labels - The array of records with time and label properties representing all non-empty labels in
 *                             the data before downsampling.
 * @returns {Array} Downsampled data filled with representative points for each missing annotated fragment
 */
    if (all_labels.length === 0 || downsampled_data.length === 0) {
      return downsampled_data;
    }

    let points_to_fill = [];
    let current_data_iter = 0;
    let current_data_label = downsampled_data[0].label;
    let current_data_timestamp = downsampled_data[0].time;

    for (let i = 0; i < all_labels.length; i++) {
      let labels_timestamp = all_labels[i].time;
      if (labels_timestamp < current_data_timestamp) {
        continue
      }

      for (let j = current_data_iter; j < downsampled_data.length; j++){
        current_data_timestamp = downsampled_data[j].time;
        if (current_data_timestamp < labels_timestamp) {
          current_data_label = downsampled_data[j].label
          continue
        }

        // add a representative point for a specific label if neighbouring labels are different
        if (current_data_label !== all_labels[i].label && downsampled_data[j].label !== all_labels[i].label) {
          let series_of_labels = [];
          for (let k = i; k < all_labels.length; k++) {
            if (all_labels[k].time >= current_data_timestamp) {
              break
            }
            series_of_labels.push(all_labels[k])
          }
          points_to_fill.push(series_of_labels[Math.floor(series_of_labels.length / 2)])
        }

        current_data_iter = j;
        current_data_label = downsampled_data[j].label
        break
      }
    }

    if (points_to_fill.length > 0) {
      downsampled_data = downsampled_data.concat(points_to_fill).sort((a, b) => a.time - b.time);
    }
    return downsampled_data;
  }

module.exports = fillMissingAnnotationsAfterDownsampling;
