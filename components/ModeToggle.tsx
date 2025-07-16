'use client'

import * as React from 'react'
import { ChevronLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className='
         flex gap-2 items-center justify-center
        '>

            <Button
                size='icon'
                onClick={() => router.back()}>
                <ChevronLeft />
            </Button>

            <Button variant="outline" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </div>
    )
}
