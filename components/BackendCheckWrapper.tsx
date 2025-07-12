'use client'

import { useEffect, useState } from "react"

export default function InternetCheckWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    const [isOnline, setIsOnline] = useState(true)
    const [isChecking, setIsChecking] = useState(false)

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine)
        }

        updateOnlineStatus() // check initially

        window.addEventListener("online", updateOnlineStatus)
        window.addEventListener("offline", updateOnlineStatus)

        return () => {
            window.removeEventListener("online", updateOnlineStatus)
            window.removeEventListener("offline", updateOnlineStatus)
        }
    }, [])

    const handleRetry = () => {
        setIsChecking(true)
        setTimeout(() => {
            setIsOnline(navigator.onLine)
            setIsChecking(false)
        }, 1500) // Simulate network check delay
    }

    if (!isOnline) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen  p-4">
                <div className="max-w-md w-full  rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 w-full"></div>

                    <div className="p-8 text-center">
                        <div className="relative inline-block mb-6">
                            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="h-12 w-12 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="absolute -inset-2 border-4 border-red-200 rounded-full animate-ping opacity-75"></div>
                        </div>

                        <h2 className="text-2xl font-bold  mb-2">
                            Connection Lost
                        </h2>
                        <p className=" mb-6">
                            Oops! It seems you're offline. Check your network connection.
                        </p>

                        <div className="space-y-4">
                            <button
                                className={`px-6 py-3 w-full flex items-center justify-center space-x-2 rounded-lg font-medium transition-all ${isChecking
                                    ? 'bg-blue-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                                    } `}
                                onClick={handleRetry}
                                disabled={isChecking}
                            >
                                {isChecking ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Checking...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Retry Connection</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center space-x-2 text-sm ">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Secure connection required</span>
                            </div>
                        </div>
                    </div>

                    <div className=" px-6 py-4 text-center border-t border-gray-200">
                        <p className="text-xs ">
                            If the problem persists, try restarting your router or checking network settings
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}