/**
 * Application-wide constants
 * Centralizes magic strings and configuration values for consistency
 */

// =============================================================================
// API Error Messages
// =============================================================================

export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: "Authentication required",
  INVALID_CREDENTIALS: "Invalid email or password",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  
  // Authorization
  FORBIDDEN: "You do not have permission to perform this action",
  PLAN_REQUIRED: "Upgrade to Pro to access this feature",
  PLAN_LIMIT_REACHED: "Free plan limit reached. Upgrade to Pro for unlimited access.",
  
  // Resources
  NOT_FOUND: "The requested resource was not found",
  APPLICATION_NOT_FOUND: "Application not found",
  NOTE_NOT_FOUND: "Note not found",
  TASK_NOT_FOUND: "Task not found",
  CONTACT_NOT_FOUND: "Contact not found",
  DOCUMENT_NOT_FOUND: "Document not found",
  INTERVIEW_NOT_FOUND: "Interview not found",
  
  // Validation
  VALIDATION_ERROR: "Please check your input and try again",
  INVALID_REQUEST: "Invalid request format",
  
  // Rate Limiting
  RATE_LIMITED: "Too many requests. Please try again later.",
  
  // Server Errors
  INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
  
  // Stripe/Billing
  STRIPE_NOT_CONFIGURED: "Billing is not configured",
  CHECKOUT_FAILED: "Failed to create checkout session",
  
  // Token Errors
  INVALID_TOKEN: "Invalid or expired token",
  TOKEN_EXPIRED: "This link has expired. Please request a new one.",
} as const;

// =============================================================================
// Success Messages
// =============================================================================

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: "Successfully logged in",
  LOGOUT_SUCCESS: "Successfully logged out",
  PASSWORD_RESET_SENT: "If an account exists, a password reset email has been sent.",
  PASSWORD_CHANGED: "Your password has been changed successfully",
  
  // CRUD Operations
  CREATED: "Successfully created",
  UPDATED: "Successfully updated",
  DELETED: "Successfully deleted",
  SAVED: "Changes saved",
  
  // Applications
  APPLICATION_CREATED: "Application created successfully",
  APPLICATION_UPDATED: "Application updated successfully",
  APPLICATION_DELETED: "Application moved to trash",
  
  // Import/Export
  IMPORT_SUCCESS: "Import completed successfully",
  EXPORT_SUCCESS: "Export completed successfully",
  
  // Billing
  UPGRADE_SUCCESS: "Welcome to Pro! You now have unlimited access.",
  DOWNGRADE_SUCCESS: "Your plan has been changed to Free.",
} as const;

// =============================================================================
// UI Text - Empty States
// =============================================================================

export const EMPTY_STATE = {
  // Applications
  NO_APPLICATIONS: {
    title: "No applications yet",
    description: "Start tracking your job search by adding your first application.",
    action: "Add Application",
  },
  
  // Notes
  NO_NOTES: {
    title: "No notes yet",
    description: "Add notes to track important details about this application.",
    action: "Add Note",
  },
  
  // Tasks
  NO_TASKS: {
    title: "No tasks yet",
    description: "Add tasks to track your to-dos for this application.",
    action: "Add Task",
  },
  
  // Contacts
  NO_CONTACTS: {
    title: "No contacts yet",
    description: "Add contacts to keep track of people at this company.",
    action: "Add Contact",
  },
  
  // Interviews
  NO_INTERVIEWS: {
    title: "No interviews scheduled",
    description: "Schedule interviews to track your progress.",
    action: "Schedule Interview",
  },
  
  // Documents
  NO_DOCUMENTS: {
    title: "No documents yet",
    description: "Add your resumes, cover letters, and other documents to keep them organized.",
    action: "Add Document",
  },
  
  // Tags/Labels
  NO_TAGS: {
    title: "No tags yet",
    description: "Add tags to your applications to organize them.",
    action: "Add Tag",
  },
  NO_LABELS: {
    title: "No labels yet",
    description: "Create labels to organize and categorize your applications.",
    action: "Create Label",
  },
  
  // Activity
  NO_ACTIVITY: {
    title: "No activity yet",
    description: "Activity will appear here as you work on this application.",
  },
  
  // Search Results
  NO_RESULTS: {
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
} as const;

// =============================================================================
// UI Text - Button Labels
// =============================================================================

export const BUTTON_LABELS = {
  // Actions
  ADD: "Add",
  EDIT: "Edit",
  DELETE: "Delete",
  SAVE: "Save",
  CANCEL: "Cancel",
  CLOSE: "Close",
  CONFIRM: "Confirm",
  SUBMIT: "Submit",
  
  // States
  SAVING: "Saving...",
  LOADING: "Loading...",
  DELETING: "Deleting...",
  ADDING: "Adding...",
  CREATING: "Creating...",
  UPDATING: "Updating...",
  
  // Authentication
  LOGIN: "Log in",
  LOGOUT: "Log out",
  REGISTER: "Create account",
  FORGOT_PASSWORD: "Forgot password?",
  RESET_PASSWORD: "Reset password",
  
  // Navigation
  BACK: "Back",
  NEXT: "Next",
  PREVIOUS: "Previous",
  
  // Specific
  ADD_NOTE: "Add Note",
  ADD_TASK: "Add Task",
  ADD_CONTACT: "Add Contact",
  ADD_APPLICATION: "Add Application",
  ADD_INTERVIEW: "Schedule Interview",
  ADD_DOCUMENT: "Add Document",
  UPGRADE_TO_PRO: "Upgrade to Pro",
  EXPORT_CSV: "Export CSV",
  IMPORT_CSV: "Import CSV",
} as const;

// =============================================================================
// Plan Configuration
// =============================================================================

export const PLAN_CONFIG = {
  FREE: {
    name: "Free",
    displayName: "Free Plan",
    maxApplications: 200,
    features: [
      "Track up to 200 applications",
      "Notes and tasks",
      "Contact management",
      "Interview scheduling",
    ],
    limitations: [
      "No CSV export",
      "Limited to 200 applications",
    ],
  },
  PRO: {
    name: "Pro",
    displayName: "Pro Plan",
    maxApplications: Infinity,
    features: [
      "Unlimited applications",
      "CSV export",
      "Priority support",
      "Advanced analytics",
    ],
    limitations: [],
  },
} as const;

// =============================================================================
// Application Stages
// =============================================================================

export const STAGE_CONFIG = {
  SAVED: {
    label: "Saved",
    color: "gray",
    description: "Job saved for later",
  },
  APPLIED: {
    label: "Applied",
    color: "blue",
    description: "Application submitted",
  },
  INTERVIEW: {
    label: "Interview",
    color: "yellow",
    description: "Interview scheduled or completed",
  },
  OFFER: {
    label: "Offer",
    color: "green",
    description: "Received job offer",
  },
  REJECTED: {
    label: "Rejected",
    color: "red",
    description: "Application rejected",
  },
} as const;

// =============================================================================
// Task Status
// =============================================================================

export const TASK_STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    color: "yellow",
  },
  DONE: {
    label: "Done",
    color: "green",
  },
} as const;

// =============================================================================
// Date/Time Formats
// =============================================================================

export const DATE_FORMATS = {
  /** e.g., "Jan 15, 2026" */
  DISPLAY: "MMM d, yyyy",
  /** e.g., "January 15, 2026" */
  DISPLAY_LONG: "MMMM d, yyyy",
  /** e.g., "2026-01-15" */
  ISO_DATE: "yyyy-MM-dd",
  /** e.g., "Jan 15, 2026 at 3:30 PM" */
  DISPLAY_WITH_TIME: "MMM d, yyyy 'at' h:mm a",
  /** e.g., "3:30 PM" */
  TIME_ONLY: "h:mm a",
  /** e.g., "Mon, Jan 15" */
  SHORT_WITH_DAY: "EEE, MMM d",
} as const;

// =============================================================================
// Pagination Defaults
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// =============================================================================
// Rate Limiting
// =============================================================================

export const RATE_LIMITS = {
  /** General API rate limit */
  API_DEFAULT: { requests: 60, windowMs: 60_000 },
  /** Login attempts */
  AUTH_LOGIN: { requests: 5, windowMs: 60_000 },
  /** Password reset requests */
  AUTH_PASSWORD_RESET: { requests: 3, windowMs: 60_000 },
  /** Billing/checkout requests */
  BILLING_CHECKOUT: { requests: 5, windowMs: 60_000 },
  /** CSV export */
  EXPORT: { requests: 10, windowMs: 60_000 },
} as const;

// =============================================================================
// Validation Constraints
// =============================================================================

export const VALIDATION = {
  /** Password requirements */
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  /** Text field limits */
  COMPANY_NAME_MAX: 200,
  POSITION_MAX: 200,
  NOTE_CONTENT_MAX: 10000,
  TASK_TITLE_MAX: 500,
  URL_MAX: 2000,
  
  /** Salary limits */
  SALARY_MIN: 0,
  SALARY_MAX: 100_000_000, // $100M should cover most cases
  
  /** Tags */
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_APPLICATION: 20,
} as const;

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: { key: "k", modifier: "meta" },
  NEW_APPLICATION: { key: "n", modifier: "meta" },
  SEARCH: { key: "/", modifier: null },
  ESCAPE: { key: "Escape", modifier: null },
} as const;

// =============================================================================
// Local Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  THEME: "theme",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
  TABLE_VIEW_PREFERENCE: "tableViewPreference",
  LAST_SELECTED_STAGE: "lastSelectedStage",
} as const;

// =============================================================================
// Analytics Event Names
// =============================================================================

export const ANALYTICS_EVENTS = {
  // Page Views
  PAGE_VIEW: "page_view",
  
  // Application Events
  APPLICATION_CREATED: "application_created",
  APPLICATION_UPDATED: "application_updated",
  APPLICATION_DELETED: "application_deleted",
  APPLICATION_STAGE_CHANGED: "application_stage_changed",
  
  // User Events
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  USER_REGISTERED: "user_registered",
  
  // Billing Events
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
} as const;
