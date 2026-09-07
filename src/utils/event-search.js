export function eventMatchesSearch(event, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;

  const title = event.title?.toLowerCase() || '';
  const description =
    event.extendedProps?.description?.toLowerCase() ||
    event.description?.toLowerCase() ||
    '';
  const location =
    event.extendedProps?.location?.toLowerCase() ||
    event.location?.toLowerCase() ||
    '';

  return (
    title.includes(query) ||
    description.includes(query) ||
    location.includes(query)
  );
}
