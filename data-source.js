/*
 * Where the dashboard gets its data.
 *
 * TODAY: it uses the sample data from sample-data.js.
 * LATER: the backend engineer replaces the body of loadLmsData() with a real
 * request to the LMS. Nothing else needs to change, as long as the response has
 * the same shape as window.SAMPLE_LMS_DATA (see sample-data.js).
 */
window.DATA_SOURCE_IS_SAMPLE = true; // set to false when real data is connected (hides the "Sample data" note)

window.loadLmsData = function loadLmsData() {
  return Promise.resolve(window.SAMPLE_LMS_DATA);

  // Example of the real version:
  // return fetch('/api/student-monitor')
  //   .then((response) => {
  //     if (!response.ok) throw new Error('LMS request failed');
  //     return response.json();
  //   });
};
