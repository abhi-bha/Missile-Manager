// Add/replace this file or merge changes into your existing pages/_app.js
import '../styles/globals.css';
import 'mapbox-gl/dist/mapbox-gl.css'; // ensure this import is present for Mapbox GL
// If you're using Leaflet instead, use: import 'leaflet/dist/leaflet.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
