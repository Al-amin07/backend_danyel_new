export async function getLatLon(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // console.log({ data });
    if (data.length > 0) {
      const location = { lat: data[0].lat, lon: data[0].lon };
      console.log('Latitude:', location.lat, 'Longitude:', location.lon);
      return location;
    } else {
      console.log('Address not found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}
