export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen">
            <div className="text-center space-y-4">
                {/* Cloud-inspired spinner */}

                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-b-red-500 border-gray-300"></div>
                {/* Loading text with animated dots */}
                <p className="text-lg font-medium ">
                    Loading your cloud storage
                </p>
                <span className="inline-block animate-pulse">
                    <span className="inline-block animate-[bounce_1s_infinite_100ms]">.</span>
                    <span className="inline-block animate-[bounce_1s_infinite_200ms]">.</span>
                    <span className="inline-block animate-[bounce_1s_infinite_300ms]">.</span>
                </span>

            </div>
        </div>
    );
}