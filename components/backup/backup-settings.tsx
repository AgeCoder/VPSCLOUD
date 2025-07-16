"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Database, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import RestoreDatabase from "./restore-db"
import { toast } from "sonner"

export function BackupSettings() {

  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleBackup = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/backup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Backup failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sqlite-${new Date().toISOString().split('T')[0]}.db`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast("Backup successful", {
        description: "Database has been backed up successfully.",
      })
    } catch (error) {
      toast("Backup failed", {
        description: error instanceof Error ? error.message : "An error occurred during backup.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleResetDatabase = async () => {
    setIsResetting(true)
    try {
      const response = await fetch(`/api/backup/reset-db`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Reset failed")
      }

      toast("Database reset successful", {
        description: "The database has been reset.",
      })
    } catch (error) {
      toast("Database reset failed", {
        description: error instanceof Error ? error.message : "An error occurred while resetting the database.",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 m-9">
      <Card>
        <CardHeader>
          <CardTitle>Database Backup</CardTitle>
          <CardDescription>Create a full backup of your database</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleBackup}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <RestoreDatabase />

      <Card>
        <CardHeader>
          <CardTitle>Reset Database</CardTitle>
          <CardDescription>
            This will reset your database to its initial state. All data will be lost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isResetting}
                  className="w-full"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {isResetting ? (
                    <>
                      Resetting...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Reset Database"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently reset your database
                    to its initial state and delete all your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetDatabase}
                    disabled={isResetting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isResetting ? (
                      <>
                        Resetting...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Confirm Reset"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}