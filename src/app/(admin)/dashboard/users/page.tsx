"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { AdminUser, AdminRole, departmentToFirestoreId, getDepartmentName, DepartmentId, adminUsers } from "@/lib/adminConfig";
import { toast } from "sonner";
import { Loading, SkeletonTable } from "@/components/ui/loading";

// Admin User form interface
interface AdminUserForm {
  id?: string;
  email: string;
  name: string;
  role: AdminRole;
  department?: DepartmentId;
  password?: string; // Optional for updates
}

export default function UsersPage() {
  const { isCoreTeam } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserForm | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState<AdminUserForm>({
    email: "",
    name: "",
    role: "dept_lead",
    department: undefined,
    password: "",
  });
  
  // Simulated data loading
  useEffect(() => {
    // In a real app, you would fetch from your API/Firestore
    setUsers(adminUsers);
    setLoading(false);
  }, []);
  
  // Filter users based on search and active tab
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((user) => {
        if (activeTab === "core") return user.role === "core_team";
        if (activeTab === "dept_lead") return user.role === "dept_lead";
        
        // Filter by specific department
        return user.department === activeTab;
      });
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, activeTab]);
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      role: "dept_lead",
      department: undefined,
      password: "",
    });
    setEditingUser(null);
  };
  
  // Open dialog for creating a new user
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing a user
  const openEditDialog = (user: AdminUser) => {
    setEditingUser({
      id: user.email,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });
    
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      password: "", // Password field is empty when editing
    });
    
    setIsDialogOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Form validation
      if (!formData.email || !formData.name || !formData.role) {
        toast.error("Please fill in all required fields", { id: "admin-users-required-fields" });
        return;
      }
      
      if (formData.role === "dept_lead" && !formData.department) {
        toast.error("Department is required for department leads", { id: "admin-users-dept-required" });
        return;
      }
      
      if (!editingUser && !formData.password) {
        toast.error("Password is required for new users", { id: "admin-users-password-required" });
        return;
      }
      
      // In a real app, you would call your API/Firestore here
      // For this example, we'll simulate with local state
      
      if (editingUser) {
        // Update existing user
        setUsers((prev) =>
          prev.map((user) =>
            user.email === editingUser.email
              ? { ...formData, password: user.password } // Keep the original password
              : user
          )
        );
        toast.success("User updated successfully", { id: "admin-users-update-success" });
      } else {
        // Create new user
        setUsers((prev) => [...prev, formData as AdminUser]);
        toast.success("User created successfully", { id: "admin-users-create-success" });
      }
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error handling form submission:", error);
      toast.error("Unable to save user information", { id: "admin-users-save-error" });
    }
  };
  
  // Simulated user deletion
  const handleDeleteUser = (email: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      // In a real app, you would call your API/Firestore here
      setUsers((prev) => prev.filter((user) => user.email !== email));
      toast.success("User deleted successfully", { id: "admin-users-delete-success" });
    }
  };
  
  // If not core team, show access denied
  if (!isCoreTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mb-4">
          <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          You don't have permission to view this page. Only core team members can manage users.
        </p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="py-8">
        <Loading size="lg" text="Loading users..." className="py-12" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Admin Users</h1>
        
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      {/* Admin Users Management */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="dark:text-white">Manage Admin Users</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Create and manage user accounts for admin access
              </CardDescription>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="core">Core Team</TabsTrigger>
              <TabsTrigger value="dept_lead">Department Leads</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 rounded-full border-t-2 border-blue-600 animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium dark:text-white">No users found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800">
                    <TableHead className="dark:text-gray-400 min-w-[150px]">Name</TableHead>
                    <TableHead className="dark:text-gray-400 min-w-[200px]">Email</TableHead>
                    <TableHead className="dark:text-gray-400 min-w-[140px]">Role</TableHead>
                    <TableHead className="dark:text-gray-400 min-w-[150px]">Department</TableHead>
                    <TableHead className="text-right dark:text-gray-400 min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.email}
                      className="border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      onClick={() => openEditDialog(user)}
                    >
                      <TableCell className="font-medium dark:text-white">
                        {user.name}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{user.email}</TableCell>
                      <TableCell>
                        {user.role === "core_team" ? (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 flex items-center w-fit gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Core Team
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center w-fit gap-1">
                            <Shield className="h-3 w-3" />
                            Department Lead
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {user.department ? getDepartmentName(user.department) : "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:border-gray-700"
                            onClick={() => handleDeleteUser(user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {editingUser
                ? "Update the user details below"
                : "Fill in the details to create a new admin user"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-gray-300">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={!!editingUser} // Disable email editing for existing users
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="dark:text-gray-300">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger id="role" className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                  <SelectItem value="core_team">Core Team</SelectItem>
                  <SelectItem value="dept_lead">Department Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.role === "dept_lead" && (
              <div className="space-y-2">
                <Label htmlFor="department" className="dark:text-gray-300">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange("department", value as DepartmentId)}
                >
                  <SelectTrigger id="department" className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                    {Object.entries(departmentToFirestoreId).map(([deptId]) => (
                      <SelectItem key={deptId} value={deptId}>
                        {getDepartmentName(deptId as DepartmentId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:border-gray-700 dark:text-gray-300">
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 