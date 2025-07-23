"use client"

import { redirect, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, EyeIcon, FileText, FolderRoot, History, LogOut, ReplyIcon, Settings } from "lucide-react"

export interface UserMenuProps {
  user: {
    email: string
    role: string
    branch?: string
    zone?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const initials = user.email.substring(0, 2).toUpperCase()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "GET" })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size='icon' className="relative h-8 w-8 rounded-full">
          <Avatar className="h-11 w-11">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <span className="text-gray-300 capitalize">{user.role}</span>

          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={
            (e) => {
              redirect('/convert')
            }
          }
        >
          <FileText />
          <span>PDF Converter</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {
          (user.role === 'admin' || user.role === 'zonal_head') && (
            <>
              <DropdownMenuItem onClick={() => redirect('/reports')}>
                <FolderRoot />
                <span>Reports</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )
        }


        {
          user.role === 'admin' && (
            <>

              <DropdownMenuItem
                onClick={
                  (e) => {
                    redirect('/setting')
                  }
                }
              >
                <Settings />
                <span> Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={
                  (e) => {
                    redirect('/log')
                  }
                }
              >
                <EyeIcon />
                <span> Login Sessions</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={
                  (e) => {
                    redirect('/accesslogs')
                  }
                }
              >
                <History />
                <span> Access Logs</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={
                  (e) => {
                    redirect('/r2-analytics')
                  }
                }
              >
                <BarChart />
                <span>R2 Analytics</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

            </>
          )
        }
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
