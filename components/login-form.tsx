"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, KeyRound } from "lucide-react"
import { isValidEmail } from "@/lib/utils"

export function LoginForm() {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address.")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
        setMessage("OTP sent to your email. Please check your inbox.")
        setMessageType("success")
      } else {
        setMessage(data.error || "Failed to send OTP. Please try again.")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })


      if (response.ok) {
        setMessage("Login successful! Redirecting...")
        setMessageType("success")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        setMessage("Invalid OTP. Please try again.")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setOtp("")
    setMessage("")
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("New OTP sent to your email.")
        setMessageType("success")
      } else {
        setMessage(data.error || "Failed to resend OTP.")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {message && (
          <Alert className={messageType === "success" ? "border-green-200 bg-green-50" : ""}>
            <AlertDescription className={messageType === "success" ? "text-green-800" : ""}>{message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send OTP
            </>
          )}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleOtpSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">Enter 6-digit OTP</Label>
        <Input
          id="otp"
          type="text"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          required
          disabled={isLoading}
          className="text-center text-lg tracking-widest"
        />
        <p className="text-sm text-gray-600">
          OTP sent to: <span className="font-medium">{email}</span>
        </p>
      </div>

      {message && (
        <Alert className={messageType === "success" ? "border-green-200 bg-green-50" : ""}>
          <AlertDescription className={messageType === "success" ? "text-green-800" : ""}>{message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Verify & Login
          </>
        )}
      </Button>

      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={handleBackToEmail} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleResendOTP}
          disabled={isLoading}
          className="flex-1 bg-transparent"
        >
          Resend OTP
        </Button>
      </div>
    </form>
  )
}
