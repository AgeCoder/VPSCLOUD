'use client'

import { Button } from "@/components/ui/button"
import { TriangleAlert } from 'lucide-react';
export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="bg-gray-50 dark:bg-gray-900">
                <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                    <div className="space-y-8 max-w-md">
                        {/* Visual element (can replace with your logo or an icon) */}
                        <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <TriangleAlert
                                size={50}
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Something went wrong
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                We're sorry for the inconvenience. Please try again or return to the dashboard.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-center w-full">
                            <Button
                                onClick={() => reset()}
                            >
                                Try Again
                            </Button>
                            <a
                                href="/dashboard"
                            >
                                <Button
                                    variant='outline'
                                >
                                    Go to Dashboard
                                </Button>
                            </a>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    )
}