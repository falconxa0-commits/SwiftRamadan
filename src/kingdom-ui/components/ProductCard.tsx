'use client';
import { forwardRef, type HTMLAttributes, type MouseEvent } from 'react';
import { Star, Clock, Plus } from 'lucide-react';
import { RoyalBadge } from './RoyalBadge';

/**
 * ProductCard — Auren Kingdom V2 premium food card.
 *
 * Renders a meal/food product with:
 *  - Image area on a kv-card surface (rounded, overflow-hidden)
 *  - Meal name (font-bold text-white)
 *  - Vendor/chef name (text-sm text-[var(--kv-text-tertiary)])
 *  - Price (font-bold, kv-gradient-gold)
 *  - RoyalBadge variant="gold" for "Halal Verified"
 *  - Delivery time with clock icon (text-xs)
 *  - Rating stars (gold)
 *  - "Add" button (kv-btn-royal small size, min-h-[44px])
 *  - Hover lift (translateY(-4px)) via the kv-card class
 *
 * forwardRef so consumers can measure / focus the card. The ref is
 * forwarded to the outer `.kv-card` div — the primary element — matching
 * the convention used by RoyalChart, RoyalTable, IntelligenceCard, etc.
 */
export interface ProductCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Meal name (display title) */
  name: string;
  /** Price in naira (rendered via kv-gradient-gold) */
  price: number;
  /** Image URL (used as a CSS background-image on the media surface) */
  image: string;
  /** Vendor / chef / restaurant name (rendered under the meal name) */
  vendor: string;
  /** Star rating (0-5). Rendered as a row of gold stars + numeric value. */
  rating: number;
  /** Delivery time label (e.g. "25 min"). Rendered with a clock icon. */
  deliveryTime: string;
  /** Click on the card body (image, title, vendor, rating, delivery). Stops the click on Add from propagating. */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Click on the Add button. The handler is responsible for stopping propagation if needed. */
  onAdd?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Number of reviews. Optional — shown in parentheses next to the rating. */
  reviews?: number;
  /** Optional discount percentage badge shown on the image. When provided, a kv-badge-gold "-X%" pill is rendered. */
  discountPct?: number;
}

/**
 * Render the star rating row. Always shows 5 stars (filled per the integer
 * portion of the rating), then the numeric rating and (optionally) the
 * review count.
 */
function RatingRow({ rating, reviews }: { rating: number; reviews?: number }) {
  const fullStars = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < fullStars ? 'fill-[var(--kv-gold)] text-[var(--kv-gold)]' : 'fill-none text-[var(--kv-text-muted)]'}`}
          aria-hidden
        />
      ))}
      <span className="text-[var(--kv-gold)] text-[10px] font-bold ml-1">{rating.toFixed(1)}</span>
      {typeof reviews === 'number' && (
        <span className="text-[var(--kv-text-tertiary)] text-[10px]">({reviews})</span>
      )}
    </div>
  );
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      name,
      price,
      image,
      vendor,
      rating,
      deliveryTime,
      onAdd,
      onClick,
      reviews,
      discountPct,
      className = '',
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`kv-card overflow-hidden cursor-pointer ${className}`}
        onClick={onClick}
        {...rest}
      >
        {/* ── Image area ── */}
        <div className="relative w-full aspect-square overflow-hidden">
          <div
            className="w-full h-full bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url("${image}")` }}
            aria-hidden
          />
          {/* Halal Verified badge (gold) — top-left, always present per V2 spec */}
          <div className="absolute top-2 left-2">
            <RoyalBadge variant="gold">Halal Verified</RoyalBadge>
          </div>
          {/* Discount pill — top-right, only when discountPct is provided */}
          {typeof discountPct === 'number' && discountPct > 0 && (
            <div className="absolute top-2 right-2">
              <RoyalBadge variant="gold">-{discountPct}%</RoyalBadge>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-3 flex flex-col gap-2">
          {/* Meal name */}
          <h4 className="text-white font-bold text-sm truncate tracking-tight leading-tight">
            {name}
          </h4>

          {/* Vendor / chef name */}
          <p className="text-sm text-[var(--kv-text-tertiary)] truncate leading-tight">
            {vendor}
          </p>

          {/* Rating row */}
          <RatingRow rating={rating} reviews={reviews} />

          {/* Delivery time */}
          <p className="text-xs text-[var(--kv-text-tertiary)] flex items-center gap-1.5">
            <Clock className="w-3 h-3" aria-hidden />
            {deliveryTime}
          </p>

          {/* Price + Add button */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="font-bold kv-gradient-gold text-base whitespace-nowrap">
              ₦{price.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={(e) => {
                // Stop the click from bubbling up to the card's onClick —
                // this prevents opening the product detail when the user
                // only meant to add to cart.
                e.stopPropagation();
                onAdd?.(e);
              }}
              className="kv-btn kv-btn-royal !min-h-[44px] !px-4 !py-2.5 text-xs font-bold flex items-center gap-1.5"
              aria-label={`Add ${name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Add
            </button>
          </div>
        </div>
      </div>
    );
  },
);
ProductCard.displayName = 'ProductCard';
