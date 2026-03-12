"use client";

import * as React from "react";
import { Palette, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hexToHSL, hslToHex, isValidHex } from "@/lib/color-utils";

const DEFAULT_PRESETS = [
  "#f87171", "#fb923c", "#fbbf24", "#84cc16", "#22c55e",
  "#14b8a6", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa",
  "#c084fc", "#e879f9", "#f472b6", "#94a3b8",
];

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  className?: string;
  /** If true, shows only the palette icon. If false, shows icon + current color swatch. */
  compact?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
  compact = true,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalColor, setInternalColor] = React.useState(value);
  const [hexInput, setHexInput] = React.useState(value);
  const [localPresets, setLocalPresets] = React.useState(presets);
  const hslRef = React.useRef(hexToHSL(value));

  React.useEffect(() => {
    setInternalColor(value);
    setHexInput(value);
    hslRef.current = hexToHSL(value);
  }, [value, open]);

  React.useEffect(() => {
    setLocalPresets(presets);
  }, [presets]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onChange(internalColor);
    }
    setOpen(next);
  };

  const handlePresetClick = (hex: string) => {
    setInternalColor(hex);
    setHexInput(hex);
    hslRef.current = hexToHSL(hex);
  };

  const handleAddPreset = () => {
    const normalized = internalColor.toLowerCase();
    if (!localPresets.some((p) => p.toLowerCase() === normalized)) {
      setLocalPresets((prev) => [...prev, internalColor]);
    }
  };

  const syncColor = (hex: string) => {
    setInternalColor(hex);
    setHexInput(hex);
    hslRef.current = hexToHSL(hex);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Number(e.target.value);
    const { s, l } = hslRef.current;
    hslRef.current = { h, s, l };
    syncColor(hslToHex(h, s, l));
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Number(e.target.value);
    const { h, l } = hslRef.current;
    hslRef.current = { h, s, l };
    syncColor(hslToHex(h, s, l));
  };

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const l = Number(e.target.value);
    const { h, s } = hslRef.current;
    hslRef.current = { h, s, l };
    syncColor(hslToHex(h, s, l));
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
    setHexInput(e.target.value);
    if (isValidHex(raw)) {
      setInternalColor(raw);
      hslRef.current = hexToHSL(raw);
    }
  };

  const { h, s, l } = hslRef.current;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg p-2 min-touch transition-colors",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "text-muted-foreground hover:text-foreground",
          className
        )}
        aria-label="Choose color"
      >
        <Palette className="h-5 w-5 shrink-0" />
        {!compact && (
          <span
            className="h-5 w-5 shrink-0 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: value }}
          />
        )}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[340px] p-4 sm:p-5">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-base font-semibold">
              Choose a color
            </DialogTitle>
            <span className="text-sm font-mono text-muted-foreground tabular-nums">
              {internalColor.toUpperCase()}
            </span>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hue slider */}
            <div className="space-y-1.5">
              <label className="sr-only">Hue</label>
              <input
                type="range"
                min="0"
                max="360"
                value={h}
                onChange={handleHueChange}
                className="h-3 w-full appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: "linear-gradient(to right, #ef4444, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ef4444)",
                }}
              />
            </div>

            {/* Saturation slider */}
            <div className="space-y-1.5">
              <label className="sr-only">Saturation</label>
              <input
                type="range"
                min="0"
                max="100"
                value={s}
                onChange={handleSaturationChange}
                className="h-3 w-full appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`,
                }}
              />
            </div>

            {/* Lightness slider */}
            <div className="space-y-1.5">
              <label className="sr-only">Lightness</label>
              <input
                type="range"
                min="0"
                max="100"
                value={l}
                onChange={handleLightnessChange}
                className="h-3 w-full appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`,
                }}
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Presets</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {localPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      "h-8 w-8 min-touch rounded-full border-2 transition-transform active:scale-95",
                      internalColor.toLowerCase() === preset.toLowerCase()
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: preset }}
                    aria-label={`Select ${preset}`}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddPreset}
                  className="flex h-8 w-8 min-touch items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Add custom color to presets"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Hex input for precise entry */}
            <div className="space-y-1.5">
              <label htmlFor="color-hex" className="text-sm font-medium">
                Custom color
              </label>
              <Input
                id="color-hex"
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#84B056"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
