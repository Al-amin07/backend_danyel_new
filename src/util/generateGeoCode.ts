import axios from 'axios';
import config from '../config';

async function geocodeAddress(addressString: string) {
  const key = config.google_api_key;
  console.log({ key });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${key}`;
  const resp = await axios.get(url);
  console.log({ resp });
  if (resp.data.status === 'OK' && resp.data.results.length > 0) {
    const loc = resp.data.results[0].geometry.location; // { lat, lng }
    return { lat: loc.lat, lng: loc.lng, raw: resp.data.results[0] };
  }
  throw new Error('Geocoding failed: ' + JSON.stringify(resp.data));
}

export default geocodeAddress;
