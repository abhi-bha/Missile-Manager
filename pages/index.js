// Example: dynamically import the Map component so it only runs in the browser
import dynamic from 'next/dynamic';
import Head from 'next/head';

const MapNoSSR = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Missile Manager</title>
      </Head>
      <main>
        <MapNoSSR />
      </main>
    </>
  );
}
