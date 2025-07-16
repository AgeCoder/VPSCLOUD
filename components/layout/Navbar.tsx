import React from 'react'
import { UserMenu, UserMenuProps } from '../user-menu'
import { ModeToggle } from '../ModeToggle'
import Syncer from '../Sync/Syncer'
import Image from 'next/image'

export default function Navbar({ user }: UserMenuProps) {
    return (
        <header className="  bg-white dark:bg-[#0a0a0a] shadow-sm sticky top-0 z-10 border rounded-b-xl mx-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-1">
                        <div>
                            <Image
                                src='/logo.png'
                                alt='logo'
                                width={50}
                                height={50}
                                className='rounded-full'
                            />
                        </div>
                        <div

                        >
                            <h1 className="text-sm font-bold  ">
                                <span
                                    className=''
                                >
                                    VPS</span>{" "}<span className="text-sky-500 ml-1">CLOUD</span>
                            </h1>
                            <>
                                <span className=" text-gray-400 capitalize text-base">{user.role}</span>
                                <span className="mx-1.5">•</span>
                                <span
                                    className='text-sm'
                                >{user.branch || user.zone}</span>
                            </>
                        </div>
                    </div>

                    <div className="flex items-centers gap-3">
                        <Syncer />
                        <ModeToggle />
                        <UserMenu user={user} />
                    </div>
                </div>
            </div>
        </header>
    )
}