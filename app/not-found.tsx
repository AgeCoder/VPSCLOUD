import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="mt-10 min-h-screen flex items-center justify-center">
            <div className="text-center p-6">
                <h1 className="text-6xl font-bold  mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/dashboard">
                    <Button className="">
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    )
}