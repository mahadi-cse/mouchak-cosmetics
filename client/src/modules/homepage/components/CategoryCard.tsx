'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CategoryCardProps {
  id: string;
  label: string;
  description: string;
  count: string;
  image: string;
  fallbackImage?: string;
}

export function CategoryCard({ id, label, description, count, image, fallbackImage }: CategoryCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imageSrc, setImageSrc] = useState(image);

  return (
    <Link href={`/shop?category=${id}`}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative h-52 sm:h-56 overflow-hidden rounded-2xl cursor-pointer group"
        style={{
          border: `2px solid ${hovered ? '#f01172' : 'transparent'}`,
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: hovered
            ? '0 20px 40px rgba(240,17,114,0.15), 0 8px 16px rgba(0,0,0,0.06)'
            : '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Background image */}
        <Image
          src={imageSrc}
          alt={label}
          fill
          className="object-cover"
          onError={() => {
            if (fallbackImage && imageSrc !== fallbackImage) {
              setImageSrc(fallbackImage);
            }
          }}
          style={{
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: hovered
              ? 'linear-gradient(to top, rgba(194,24,91,0.85) 0%, rgba(240,17,114,0.3) 55%, transparent 100%)'
              : 'linear-gradient(to top, rgba(20,10,15,0.75) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
            transition: 'background 0.4s ease',
          }}
        />

        {/* Product count pill */}
        <div className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-pink-700 tracking-wide">
          {count}
        </div>

        {/* Text bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-[2px]"
            style={{ color: 'rgba(255,220,240,0.9)' }}
          >
            {description}
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {label}
            </h3>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-white/40"
              style={{
                background: hovered ? '#f01172' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
              }}
            >
              <ChevronRight
                size={15}
                className="text-white"
                style={{
                  transform: hovered ? 'translateX(2px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
