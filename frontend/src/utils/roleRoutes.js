// Maps each role to its default landing page after login
export const roleDefaultRoutes = {
  admin: "/admin/dashboard",
  recruiter: "/recruiter/dashboard",
  vendor: "/vendor/dashboard",
  client: "/client/dashboard",
};

export const getRoleDefaultRoute = (role) => {
  return roleDefaultRoutes[role] || "/login";
};