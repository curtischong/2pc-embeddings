'use client'
import React, { useState, useCallback, useEffect } from 'react';

import Tabs from '../../components/Tabs';


export default function LandingPage() {
  return (
    <section className="text-center bg-pink-100 py-12 px-4 flex flex-col justify-center items-center min-h-screen">
      <Tabs />
    </section>
  );
}

