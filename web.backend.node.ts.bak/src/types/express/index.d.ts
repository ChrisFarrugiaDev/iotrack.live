import "express"

// Re-open (augment) the built-in Express namespace
declare module "express-serve-static-core" {
  
  // Extend the Request interface to include our custom property.
  // `userID` is optional because it will only be set after authentication middleware runs.
  interface Request {
    userID?: string;
    userRoleID?: string;
    userOrgUuid?: string;
  }
}