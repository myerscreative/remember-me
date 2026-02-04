"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BirthdayPickerProps {
  date?: string | null;
  onChange: (date: string | null) => void;
  className?: string;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = (i + 1).toString().padStart(2, "0");
  return { value: day, label: day };
});

export function BirthdayPicker({ date, onChange, className }: BirthdayPickerProps) {
  // Parse initial date
  const parseDate = (dateStr?: string | null) => {
    if (!dateStr) return { month: "", day: "", year: "" };
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return {
          year: y === "1900" ? "" : y,
          month: m,
          day: d,
        };
      }
      return { month: "", day: "", year: "" };
    } catch {
      return { month: "", day: "", year: "" };
    }
  };

  const [values, setValues] = React.useState(parseDate(date));

  // Update internal state when prop changes
  React.useEffect(() => {
    setValues(parseDate(date));
  }, [date]);

  const updateDate = (newValues: typeof values) => {
    setValues(newValues);
    
    // Only fire onChange if we have at least month and day
    if (newValues.month && newValues.day) {
      // Use 1900 as sentinel for "no year"
      const yearToSave = newValues.year.trim() || "1900";
      
      const formattedDate = `${yearToSave}-${newValues.month}-${newValues.day}`;
      onChange(formattedDate);
    } else {
      // If cleared, set to null
      if (!newValues.month && !newValues.day && !newValues.year) {
        onChange(null);
      }
    }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <div className="col-span-1">
        <Select
          value={values.month}
          onChange={(e) => updateDate({ ...values, month: e.target.value })}
        >
          <option value="" disabled>Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="col-span-1">
        <Select
          value={values.day}
          onChange={(e) => updateDate({ ...values, day: e.target.value })}
        >
          <option value="" disabled>Day</option>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="col-span-1 relative">
        <Input
          type="number"
          placeholder="Year (Opt)"
          value={values.year}
          onChange={(e) => updateDate({ ...values, year: e.target.value })}
          className="w-full"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>
    </div>
  );
}
