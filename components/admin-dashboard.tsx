"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus, Trash2, FileText, Activity, Settings, BarChart, History } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getBranchesByZone, ZONE_MAPPING } from "@/lib/zones"
import { toast } from "sonner"

type User = {
  id: number
  email: string
  role: 'admin' | 'zone' | 'branch'
  zone: string | null
  branch: string | null
  createdAt: string
}

type Stats = {
  totalUsers: number
  totalDocuments: number
  totalDownloads: number
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDocuments: 0,
    totalDownloads: 0,
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    role: "branch" as const,
    zone: "",
    branch: "",
  })
  const [availableBranches, setAvailableBranches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    if (newUser.role === 'admin') {
      setNewUser(prev => ({ ...prev, zone: '', branch: '' }))
    } else if (newUser.zone) {
      const branches = getBranchesByZone(newUser.zone)
      setAvailableBranches(branches)
      setNewUser(prev => ({ ...prev, branch: branches.length > 0 ? branches[0] : '' }))
    }
  }, [newUser.zone, newUser.role])

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ])

      if (usersRes.ok) setUsers(await usersRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email.trim()) {
      toast.error("Email is required")
      return
    }

    if (newUser.role !== 'admin' && !newUser.zone) {
      toast.error("Zone is required for non-admin users")
      return
    }

    if (newUser.role === 'branch' && !newUser.branch) {
      toast.error("Branch is required for branch users")
      return
    }

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to create user")
        return
      }

      setUsers(prev => [...prev, data.user])
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
      setNewUser({
        email: "",
        role: "branch",
        zone: "",
        branch: "",
      })
      setIsCreatingUser(false)
      toast.success("User created successfully")
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Failed to create user")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/delete/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
        toast.success("User deleted successfully")
      } else {
        toast.error("Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const getUserBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'zone': return 'default'
      case 'branch': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage system users and their access levels
              </CardDescription>
            </div>
            <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: 'admin' | 'zone' | 'branch') =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="zone">Zone Manager</SelectItem>
                        <SelectItem value="branch">Branch User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role !== 'admin' && (
                    <div>
                      <Label>Zone</Label>
                      <Select
                        value={newUser.zone}
                        onValueChange={(value) => setNewUser({ ...newUser, zone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(ZONE_MAPPING).map(zone => (
                            <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newUser.role === 'branch' && newUser.zone && (
                    <div>
                      <Label>Branch</Label>
                      <Select
                        value={newUser.branch}
                        onValueChange={(value) => setNewUser({ ...newUser, branch: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBranches.map(branch => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreatingUser(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Create User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating a new user
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getUserBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        {user.zone && <Badge variant="outline">{user.zone}</Badge>}
                        {user.branch && <Badge variant="outline">{user.branch}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    {user.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}