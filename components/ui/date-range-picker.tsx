"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
    onUpdate: (range: DateRange | undefined) => void;
    initialDateFrom?: Date;
    initialDateTo?: Date;
}

export function DateRangePicker({ onUpdate, initialDateFrom, initialDateTo }: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: initialDateFrom,
        to: initialDateTo,
    });

    React.useEffect(() => {
        setDate({
            from: initialDateFrom,
            to: initialDateTo,
        });
    }, [initialDateFrom, initialDateTo]);

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        onUpdate(range);
    };

    const formattedDate =
        date?.from && date?.to
            ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
            : date?.from
                ? format(date.from, "LLL dd, y")
                : "Pick a date";

    return (
        <div className="grid gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formattedDate}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}