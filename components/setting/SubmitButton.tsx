// app/settings/components/SubmitButton.tsx
'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
    children: React.ReactNode
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    disabled?: boolean
}

export function SubmitButton({ children, variant = 'default', size = 'default', disabled }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            variant={variant}
            size={size}
            disabled={pending || disabled}
            className="flex items-center gap-2"
        >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </Button>
    )
}