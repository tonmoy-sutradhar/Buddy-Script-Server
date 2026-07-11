// An application depends on what roles it will have.
// src\config\roles.js
const allRoles = {
  user: ["common", "user"],
  provider: ["common", "provider"],
  admin: ["common", "commonAdmin", "admin"],
  superAdmin: ["common", "commonAdmin", "superAdmin"],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
