export const PERMISSIONS = {
    view_staff: "View Staff",
    manage_staff: "Manage Staff",
    view_users: "View Users",
    manage_users: "Manage Users",
    view_roles: "View Roles",
    manage_roles: "Manage Roles",
    provider_access: "Provider Access"
};

export const staffEndpoints = {
    "/api/workspaces/staff/users": {
        permission: "view_users",
        method: ["GET"]
    },
    "/api/workspaces/staff/roles": {
        permission: "view_roles",
        method: ["GET"]
    }
};
