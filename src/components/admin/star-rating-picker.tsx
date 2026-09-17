"use client";

import { Star } from "lucide-react";

type StarRatingPickerProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRatingPicker({ value, onChange }: StarRatingPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const active = rating <= value;

        return (
          <button
            key={rating}
            type="button"
            aria-label={`Rate ${rating} stars`}
            onClick={() => onChange(rating)}
            className="inline-flex size-9 items-center justify-center rounded-default transition-colors hover:bg-background"
          >
            <Star
              className={`size-5 ${active ? "fill-accent text-accent" : "text-muted"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
