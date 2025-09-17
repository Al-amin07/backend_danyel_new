// export async function getLatLon(address: string) {
//   const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

import config from '../config';

//   try {
//     const response = await fetch(url);
//     const data = await response.json();
//     // console.log({ data });
//     if (data.length > 0) {
//       const location = { lat: data[0].lat, lon: data[0].lon };
//       console.log('Latitude:', location.lat, 'Longitude:', location.lon);
//       return location;
//     } else {
//       console.log('Address not found');
//       return null;
//     }
//   } catch (error) {
//     console.error('Error fetching location:', error);
//     return null;
//   }
// }

export async function getLatLon(address: string) {
  const apiKey = config.google_api_key; // Store in env, don’t hardcode
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Latitude:', location.lat, 'Longitude:', location.lng);
      return { lat: location.lat, lon: location.lng };
    } else {
      console.log('Address not found:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}
