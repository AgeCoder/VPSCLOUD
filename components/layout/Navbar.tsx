import React from 'react'
import { UserMenu, UserMenuProps } from './user-menu'
import { ModeToggle } from '../ModeToggle'
import Syncer from '../Sync/Syncer'
import Image from 'next/image'

export default function Navbar({ user }: UserMenuProps) {
    return (
        <header className="bg-[#21014b]  shadow-sm sticky top-0 z-10 border-b border-[#3a1d7a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
                <div className="flex justify-between items-center h-16">
                    {/* Left section - Logo and Title */}
                    <div className="flex items-center space-x-4 text-white">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <Image
                                    src="/logo.png"
                                    height={42}
                                    width={42}
                                    alt="District Urban Cooperative Bank Sangli Logo"
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-lg font-bold leading-tight tracking-tight">
                                    वीराचार्य बाबासाहेब कुचनुरे
                                </h1>
                                <p className="text-xs text-gray-300">
                                    जिल्हा नागरी सहकारी पतसंस्था मर्यादित, सांगली
                                </p>
                            </div>
                        </div>

                        {/* User info */}
                    </div>


                    {/* Right section - Controls */}
                    <div className="flex items-center space-x-4">
                        <div className="items-center text-sm">
                            <span className="text-gray-300 capitalize">{user.role}</span>
                            {
                                user.branch && (
                                    <>
                                        <span className="mx-2 text-gray-500">•</span>
                                        <span className="text-gray-100">
                                            {user.branch}
                                        </span></>
                                )
                            }
                            {
                                user.zone && (
                                    <>
                                        <span className="mx-2 text-gray-500">•</span>
                                        <span className="text-gray-100">
                                            {user.zone}
                                        </span></>
                                )
                            }
                        </div>
                        <div className="hidden sm:block">
                            <Syncer />
                        </div>
                        <ModeToggle />
                        <UserMenu user={user} />
                    </div>
                </div>

                {/* Mobile user info */}
                <div className="md:hidden py-2 px-4 border-t border-[#3a1d7a]">
                    <div className="flex items-center text-sm">
                        <span className="text-gray-300 capitalize">{user.role}</span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-gray-100">
                            {user.branch || user.zone}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}