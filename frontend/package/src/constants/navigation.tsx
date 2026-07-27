import { PERMISSIONS } from "@/constants/permissions";

export const navigation = [

{
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
},

{
    id: "members",

    title: "Members",

    children: [

        {
            id: "member-list",
            title: "Member List",
            href: "/members",
            permission: PERMISSIONS.VIEW_MEMBERS,
        },

        {
            id: "register-member",
            title: "Register Member",
            href: "/members/register",
            permission: PERMISSIONS.CREATE_MEMBERS,
        },

    ],
},

{
    id: "administration",

    title: "Administration",

    permissions: [

        PERMISSIONS.MANAGE_USERS,

        PERMISSIONS.MANAGE_ROLES,

    ],

    children: [

        {
            id: "users",
            title: "Users",
            href: "/administration/users",
            permission: PERMISSIONS.MANAGE_USERS,
        },

        {
            id: "roles",
            title: "Roles",
            href: "/administration/roles",
            permission: PERMISSIONS.MANAGE_ROLES,
        },

    ],
},

];