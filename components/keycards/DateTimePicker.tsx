"use client";

import { type ComponentProps, useState } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DATE_FORMATTER = new Intl.DateTimeFormat("et-EE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

interface Props {
  readonly selectedDate: Date | undefined;
  readonly selectedTime: string;
  readonly onDateChange: (date: Date | undefined) => void;
  readonly onTimeChange: (time: string) => void;
  readonly calendarDisabled?: ComponentProps<typeof Calendar>["disabled"];
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  calendarDisabled,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleClear = () => {
    onDateChange(undefined);
    onTimeChange("00:00");
  };

  return (
    <div className="flex gap-2">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <CalendarMonthIcon className="shrink-0 text-slate-400 !text-[18px]" />
            <span
              className={selectedDate ? "text-slate-800" : "text-slate-400"}
            >
              {selectedDate
                ? DATE_FORMATTER.format(selectedDate)
                : "Vali kuupäev…"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateChange(date);
              setCalendarOpen(false);
            }}
            captionLayout="dropdown"
            disabled={calendarDisabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {selectedDate && (
        <>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            aria-label="Kellaaeg"
          />
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition"
            aria-label="Eemalda kuupäev"
          >
            <CloseIcon className="!text-[18px]" />
          </button>
        </>
      )}
    </div>
  );
}
