import { OrganizationUser } from "./user";

// ============================================================
// USER TOOLBAR
// ============================================================

export interface UserToolbarProps {
  onRefresh: () => Promise<void>;
}

// ============================================================
// USER DATA GRID
// ============================================================

export interface UserDataGridProps {
  users: OrganizationUser[];

  loading?: boolean;

  onRefresh: () => Promise<void>;
}

// ============================================================
// USER DIALOG
// ============================================================

export interface UserDialogProps {
  open: boolean;

  mode: "create" | "edit";

  user: OrganizationUser | null;

  onClose: () => void;

  onSuccess: () => Promise<void>;
}

// ============================================================
// USER FORM
// ============================================================

export interface UserFormProps {
  mode: "create" | "edit";

  user: OrganizationUser | null;

  onCancel: () => void;

  onSuccess: () => Promise<void>;
}

// ============================================================
// DELETE USER DIALOG
// ============================================================

export interface DeleteUserDialogProps {
  open: boolean;

  user: OrganizationUser | null;

  onClose: () => void;

  onSuccess: () => Promise<void>;
}