export function createLfxMeetingsEventSource(url = '/api/lfx-meetings') {
  return (fetchInfo, successCallback, failureCallback) => {
    const rangeStart = new Date(fetchInfo.start);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
    const rangeEnd = new Date(fetchInfo.end);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

    const params = new URLSearchParams({
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    });

    fetch(`${url}?${params}`)
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error(`LFX meetings fetch failed ${response.status}`);
          error.url = url;
          throw error;
        }
        const data = await response.json();
        successCallback(Array.isArray(data.events) ? data.events : []);
      })
      .catch(failureCallback);
  };
}
