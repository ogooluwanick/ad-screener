"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit, UserPlus, Users, Eye, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean | null;
  createdAt: string;
  updatedAt: string;
  submitterType?: string;
  letterOfAuthorityUrl?: string | null;
  companyName?: string;
  registrationNumber?: string; // Added
  cacDocumentUrl?: string | null; // Assuming this might exist or be needed
  meansOfIdUrl?: string | null; // Assuming this might exist or be needed
  proofOfAddressUrl?: string | null; // Assuming this might exist or be needed
}

interface EditUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<EditUserData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (e: any) {
      console.error("Failed to fetch users:", e);
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUser(null);
    setIsEditModalOpen(false);
    setEditData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
    });
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          role: editData.role,
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });

      handleCloseEditModal();
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenViewModal = (user: User) => {
    setSelectedUserForView(user);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setSelectedUserForView(null);
    setIsViewModalOpen(false);
  };

  const handleOpenDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setUserToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      toast({
        title: "User Deleted",
        description: `${userToDelete.firstName} ${userToDelete.lastName} has been deleted.`,
      });
      fetchUsers(); // Refresh list
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Could not delete user.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-red-600 bg-red-50";
      case "superadmin":
        return "text-purple-600 bg-purple-50";
      case "reviewer":
        return "text-green-600 bg-green-50"; // Changed to green
      case "submitter":
        return "text-yellow-600 bg-yellow-50"; // submitter is often yellow/orange, keeping it distinct
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="flex items-center space-x-4 p-2 border-b">
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 md:p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchUsers} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            Refresh List
          </Button>
          <Link href="/admin/create-reviewer">
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Reviewer
            </Button>
          </Link>
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No users found.</p>
            <p className="text-muted-foreground">Users will appear here once they register.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user accounts and their roles. Click edit to modify user information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.emailVerified ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                      }`}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenViewModal(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteConfirm(user)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseEditModal(); else setIsEditModalOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
            <DialogDescription>
              Update user information and role. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                placeholder="First name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={editData.role} onValueChange={(value) => setEditData({ ...editData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitter">Submitter</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Letter of Authority if Agency Submitter */}
            {selectedUser?.submitterType === 'agency' && selectedUser?.letterOfAuthorityUrl && (
              <div className="space-y-2">
                <Label htmlFor="letterOfAuthority">Letter of Authority</Label>
                <div className="mt-1">
                  <Link
                    href={selectedUser.letterOfAuthorityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 underline break-all"
                    title={selectedUser.letterOfAuthorityUrl}
                  >
                    View Document
                  </Link>
                </div>
              </div>
            )}
            {selectedUser?.submitterType === 'agency' && !selectedUser?.letterOfAuthorityUrl && (
                <div className="space-y-2">
                  <Label htmlFor="letterOfAuthority">Letter of Authority</Label>
                  <p className="text-sm text-gray-500">Not uploaded.</p>
                </div>
            )}
             {/* Display Company Name if Submitter */}
             {selectedUser?.role === 'submitter' && selectedUser?.companyName && (
              <div className="space-y-2">
                <Label>
                  {selectedUser.submitterType === 'agency' ? 'Agency Name' : 'Business Name'}
                </Label>
                <p className="text-sm text-gray-700">{selectedUser.companyName}</p>
              </div>
            )}

          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseViewModal(); else setIsViewModalOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>View User: {selectedUserForView?.firstName} {selectedUserForView?.lastName}</DialogTitle>
            <DialogDescription>
              Detailed information for the selected user.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserForView && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><Label>First Name</Label><p className="text-sm text-gray-700">{selectedUserForView.firstName}</p></div>
                <div><Label>Last Name</Label><p className="text-sm text-gray-700">{selectedUserForView.lastName}</p></div>
                <div className="col-span-2"><Label>Email</Label><p className="text-sm text-gray-700">{selectedUserForView.email}</p></div>
                <div><Label>Role</Label><p className="text-sm text-gray-700">{selectedUserForView.role}</p></div>
                <div>
                  <Label>Email Verified</Label>
                  <p className={`text-sm ${selectedUserForView.emailVerified ? "text-green-600" : "text-red-600"}`}>
                    {selectedUserForView.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div><Label>Joined On</Label><p className="text-sm text-gray-700">{new Date(selectedUserForView.createdAt).toLocaleString()}</p></div>
                <div><Label>Last Updated</Label><p className="text-sm text-gray-700">{new Date(selectedUserForView.updatedAt).toLocaleString()}</p></div>
                
                {selectedUserForView.role === 'submitter' && (
                  <>
                    <div>
                      <Label>Submitter Type</Label>
                      <p className="text-sm text-gray-700">{selectedUserForView.submitterType || "Not provided"}</p>
                    </div>
                    <div>
                      <Label>{selectedUserForView.submitterType === 'agency' ? 'Agency Name' : 'Business Name'}</Label>
                      <p className="text-sm text-gray-700">{selectedUserForView.companyName || "Not provided"}</p>
                    </div>
                    <div>
                      <Label>Registration Number</Label>
                      <p className="text-sm text-gray-700">{selectedUserForView.registrationNumber || "Not provided"}</p>
                    </div>
                     <div>
                      <Label>CAC Document</Label>
                      {selectedUserForView.cacDocumentUrl ? (
                        <Link href={selectedUserForView.cacDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 underline break-all">View Document</Link>
                      ) : <p className="text-sm text-gray-500">Not uploaded</p>}
                    </div>
                    <div>
                      <Label>Means of ID</Label>
                      {selectedUserForView.meansOfIdUrl ? (
                        <Link href={selectedUserForView.meansOfIdUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 underline break-all">View Document</Link>
                      ) : <p className="text-sm text-gray-500">Not uploaded</p>}
                    </div>
                     <div>
                      <Label>Proof of Address</Label>
                      {selectedUserForView.proofOfAddressUrl ? (
                        <Link href={selectedUserForView.proofOfAddressUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 underline break-all">View Document</Link>
                      ) : <p className="text-sm text-gray-500">Not uploaded</p>}
                    </div>
                    {selectedUserForView.submitterType === 'agency' && (
                       <div>
                        <Label>Letter of Authority</Label>
                        {selectedUserForView.letterOfAuthorityUrl ? (
                          <Link href={selectedUserForView.letterOfAuthorityUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 underline break-all">View Document</Link>
                        ) : <p className="text-sm text-gray-500">Not uploaded</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user 
              <span className="font-semibold"> {userToDelete?.firstName} {userToDelete?.lastName}</span> and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteConfirm} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Yes, delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AdminUsersPage;
