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
}

export function CategoryCard({ id, label, description, count, image }: CategoryCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/shop?category=${id}`}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative h-48 overflow-hidden rounded-2xl border-2 border-transparent transition-all duration-300 cursor-pointer"
        style={{
          borderColor: hovered ? '#e91e8c' : 'transparent',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 14px 36px rgba(233,30,140,0.18)'
            : '0 4px 14px rgba(0,0,0,0.08)',
        }}
      >
        {/* Background image */}
        <Image
          src={image}
          alt={label}
          fill
          className="object-cover transition-transform duration-400"
          style={{
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: hovered
              ? 'linear-gradient(to top, rgba(194,24,91,0.82) 0%, rgba(233,30,140,0.28) 60%, transparent 100%)'
              : 'linear-gradient(to top, rgba(30,10,20,0.72) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
          }}
        />

        {/* Product count pill */}
        <div
          className="absolute right-3 top-3 rounded-full bg-white bg-opacity-92 px-2.5 py-1 text-center text-xs font-bold text-pink-700"
          style={{ letterSpacing: '0.5px' }}
        >
          {count}
        </div>

        {/* Text bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p
            className="mb-0.5 text-xs font-semibold uppercase"
            style={{
              color: 'rgba(255,220,240,0.9)',
              letterSpacing: '1.5px',
            }}
          >
            {description}
          </p>
          <div className="flex items-center justify-between">
            <h3
              className="m-0 text-2xl font-black text-white"
              style={{ letterSpacing: '-0.5px' }}
            >
              {label}
            </h3>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-1.5 border-white border-opacity-50 transition-all duration-300"
              style={{
                background: hovered ? '#e91e8c' : 'rgba(255,255,255,0.2)',
              }}
            >
              <ChevronRight size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
