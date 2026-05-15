'use client';

import Footer from '../components/Footer';
import PulseDemoEditor from './PulseDemoEditor';

export default function DemoPage() {
  return (
    <>
      <main id="main-content">
        <PulseDemoEditor />
      </main>
      <Footer />
    </>
  );
}
