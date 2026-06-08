import React from 'react';
import styles from './Beranda.module.css';

import Hero from '../../components/home/Hero';
import Features from '../../components/home/Features';
import Testimonials from '../../components/home/Testimonials';
import VideoProfile from '../../components/home/VideoProfile';
import Gallery from '../../components/home/Gallery';

function Beranda() {
  return (
    <div className={styles.container}>
      <Hero />
      <Features />
      <Testimonials />
      <VideoProfile />
      <Gallery />
    </div>
  );
}

export default Beranda;
