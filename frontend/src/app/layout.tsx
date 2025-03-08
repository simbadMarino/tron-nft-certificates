'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



interface GridImage {
  index: number;
  opacity: number;
  isGlowing: boolean;
}

function BackgroundGrid() {
  const TOTAL_IMAGES = 250;
  const GLOW_COUNT = 5;
  const FADE_DURATION = 500; // Duration for fade in/out
  const GLOW_INTERVAL = 4000; // Time between selecting new images
  
  // Track each image's state
  const [images, setImages] = useState<GridImage[]>(() => 
    Array.from({ length: TOTAL_IMAGES }, (_, index) => ({
      index,
      opacity: 0.05,
      isGlowing: false
    }))
  );

  // Function to generate random unique indices
  const getRandomIndices = () => {
    const indices: number[] = [];
    while (indices.length < GLOW_COUNT) {
      const randomIndex = Math.floor(Math.random() * TOTAL_IMAGES);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    return indices;
  };

  useEffect(() => {
    const updateGlowingImages = () => {
      const newGlowingIndices = getRandomIndices();
      
      setImages(prevImages => 
        prevImages.map(img => ({
          ...img,
          isGlowing: newGlowingIndices.includes(img.index)
        }))
      );
    };

    // Initial glow effect
    updateGlowingImages();

    // Set up interval for changing glowing images
    const intervalId = setInterval(updateGlowingImages, GLOW_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Handle opacity animations
  useEffect(() => {
    const animateOpacity = () => {
      setImages(prevImages =>
        prevImages.map(img => {
          const targetOpacity = img.isGlowing ? 1 : 0.05;
          const opacityDiff = targetOpacity - img.opacity;
          const step = opacityDiff * 0.1; // Smooth transition step
          
          return {
            ...img,
            opacity: img.opacity + step
          };
        })
      );
    };

    // Run animation frame
    const animationId = setInterval(animateOpacity, 50); // Update every 50ms

    return () => clearInterval(animationId);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div className="grid grid-cols-[repeat(auto-fill,100px)] grid-rows-[repeat(auto-fill,100px)]">
        {images.map((img) => (
          <div 
            key={img.index} 
            className="w-[100px] h-[100px] relative"
            style={{
              opacity: img.opacity,
              transition: `opacity ${FADE_DURATION}ms ease-in-out`
            }}
          >
            <Image
              src="/tron-logo.jpeg"
              alt="Tron Logo"
              width={100}
              height={100}
              className="object-cover"
            />
            {img.isGlowing && (
              <div 
                className="absolute inset-0 bg-blue-500 mix-blend-overlay animate-pulse"
                style={{
                  opacity: img.opacity * 0.3 // Subtle overlay effect
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        <BackgroundGrid />
        {children}
      </body>
    </html>
  );
}