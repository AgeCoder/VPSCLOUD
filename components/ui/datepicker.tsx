"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DatePicker({
    selected,
    onChange,
    placeholderText = "Pick a date",
    className,
}: {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    className?: string;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected ? format(selected, "PPP") : <span>{placeholderText}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selected || undefined}
                    onSelect={(date) => onChange(date)}
                    initialFocus
                />
                {selected && (
                    <div className="p-3 border-t border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => onChange(null)}
                        >
                            Clear selection
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}