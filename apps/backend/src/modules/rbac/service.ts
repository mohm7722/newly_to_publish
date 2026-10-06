import { randomUUID } from "crypto"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { Role } from "./models/role"
import { UserRole } from "./models/user-role"
import { sanitizePermissions, isValidPermission, BASELINE_PERMISSIONS } from "./permissions"

const SLUG_MAX_LENGTH = 100
const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 255
const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/

/** Input accepted by {@link RbacModuleService.createRole}. */
export type CreateRoleInput = {
  name: string
  slug: string
  description?: string | null
  permissions?: string[]
  is_super?: boolean
  is_system?: boolean
}

/** Partial input accepted by {@link RbacModuleService.updateRole}. */
export type UpdateRoleInput = Partial<{
  name: string
  description: string | null
  permissions: string[]
}>

/** Effective permission context resolved for an acting user. */
export type ResolvedPermissions = {
  /** All role slugs assigned to the user. */
  roles: string[]
  /** Union of permission keys across the user's roles. */
  permissions: string[]
  /** True when the user holds any `is_super` role (bypasses checks). */
  isSuper: boolean
}

/**
 * Validate and normalize a role display name (1–255 chars, non-blank).
 *
 * @throws {MedusaError} INVALID_DATA when missing/blank/too long.
 */
function validateName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length < NAME_MIN_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "name is required and must be a non-empty string"
    )
  }
  if (name.length > NAME_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `name must be at most ${NAME_MAX_LENGTH} characters`
    )
  }
  return name.trim()
}

/**
 * Validate and normalize a role slug (lowercase snake_case identifier).
 *
 * @throws {MedusaError} INVALID_DATA when the slug is malformed or too long.
 */
function validateSlug(slug: unknown): string {
  if (typeof slug !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "slug is required and must be a string"
    )
  }
  const normalized = slug.trim().toLowerCase()
  if (!SLUG_PATTERN.test(normalized)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "slug must be lowercase snake_case, e.g. finance_manager"
    )
  }
  if (normalized.length > SLUG_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `slug must be at most ${SLUG_MAX_LENGTH} characters`
    )
  }
  return normalized
}

/**
 * RbacModuleService.
 *
 * Wires the {@link Role} and {@link UserRole} models into the idiomatic Medusa
 * 2.16 `MedusaService` factory and layers the validated business operations for
 * role management, user-role assignment, and effective-permission resolution on
 * top of the generated CRUD primitives.
 *
 * Generated primitives (from the factory keys):
 *  - `RbacRole`     → `listRbacRoles` / `retrieveRbacRole` / `createRbacRoles` /
 *                     `updateRbacRoles` / `deleteRbacRoles`.
 *  - `RbacUserRole` → `listRbacUserRoles` / `createRbacUserRoles` /
 *                     `deleteRbacUserRoles`, etc.
 */
class RbacModuleService extends MedusaService({
  RbacRole: Role,
  RbacUserRole: UserRole,
}) {
  // ── Roles ──────────────────────────────────────────────────────────────

  /** List all roles ordered by name ascending. */
  async listRoles() {
    return await super.listRbacRoles({}, { order: { name: "ASC" } })
  }

  /**
   * Retrieve a single role by id.
   * @throws {MedusaError} NOT_FOUND when the role does not exist.
   */
  async retrieveRole(id: string) {
    return await super.retrieveRbacRole(id)
  }

  /** Find a role by its unique slug, or `undefined` when none matches. */
  async getRoleBySlug(slug: string) {
    const [row] = await super.listRbacRoles({ slug }, { take: 1 })
    return row
  }

  /**
   * Create a role (Requirement: full dynamic role control).
   *
   * Validates the name/slug, ensures slug uniqueness, and stores only valid
   * permission keys from the catalog. Custom roles created from the UI are
   * never `is_super`/`is_system`.
   *
   * @throws {MedusaError} INVALID_DATA on invalid fields or duplicate slug.
   */
  async createRole(data: CreateRoleInput) {
    const name = validateName(data.name)
    const slug = validateSlug(data.slug)
    const permissions = sanitizePermissions(data.permissions ?? [])

    const existing = await this.getRoleBySlug(slug)
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `A role with the slug "${slug}" already exists`
      )
    }

    return await super.createRbacRoles({
      id: `role_${randomUUID()}`,
      name,
      slug,
      description:
        typeof data.description === "string" ? data.description : null,
      // `permissions` is a jsonb column holding a `string[]`; the generated
      // type narrows json to `Record<string, unknown>`, so cast through
      // `unknown` for the write (same pattern as the payments module).
      permissions: permissions as unknown as Record<string, unknown>,
      is_super: data.is_super === true,
      is_system: data.is_system === true,
    })
  }

  /**
   * Partially update a role's name, description, and/or permissions.
   *
   * Guard rails:
   *  - a super role is fully locked (cannot be edited);
   *  - the slug and the `is_super`/`is_system` flags are immutable.
   *
   * @throws {MedusaError} NOT_FOUND when the role is missing.
   * @throws {MedusaError} NOT_ALLOWED when attempting to edit a super role.
   * @throws {MedusaError} INVALID_DATA on invalid field values.
   */
  async updateRole(id: string, data: UpdateRoleInput) {
    const existing = await super.retrieveRbacRole(id)

    if (existing.is_super) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The super-admin role cannot be modified"
      )
    }

    const update: Record<string, unknown> = { id }

    if (data.name !== undefined) {
      update.name = validateName(data.name)
    }
    if (data.description !== undefined) {
      update.description =
        typeof data.description === "string" ? data.description : null
    }
    if (data.permissions !== undefined) {
      update.permissions = sanitizePermissions(data.permissions)
    }

    return await super.updateRbacRoles(update)
  }

  /**
   * Delete a role by id. System roles (seeded defaults) cannot be deleted.
   * Deleting a role also removes all its user assignments.
   *
   * @throws {MedusaError} NOT_FOUND when the role is missing.
   * @throws {MedusaError} NOT_ALLOWED when the role is a system role.
   */
  async deleteRole(id: string): Promise<void> {
    const existing = await super.retrieveRbacRole(id)
    if (existing.is_system) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "System roles cannot be deleted"
      )
    }

    const assignments = await super.listRbacUserRoles({ role_id: id })
    if (assignments.length > 0) {
      await super.deleteRbacUserRoles(assignments.map((a) => a.id))
    }
    await super.deleteRbacRoles(id)
  }

  /**
   * Create or reconcile a default/system role to an authoritative definition.
   * Used by the RBAC sync migration script: system roles are managed defaults,
   * so their name/description/permissions/flags are reset to the definition
   * (this bypasses the `is_super` edit lock that {@link updateRole} enforces for
   * UI callers). Custom (non-system) roles are never passed here.
   */
  async reconcileDefaultRole(def: {
    slug: string
    name: string
    description: string
    permissions: readonly string[]
    is_super: boolean
    is_system: boolean
  }) {
    const permissions = sanitizePermissions([...def.permissions])
    const existing = await this.getRoleBySlug(def.slug)

    if (!existing) {
      return await super.createRbacRoles({
        id: `role_${randomUUID()}`,
        name: def.name,
        slug: def.slug,
        description: def.description,
        permissions: permissions as unknown as Record<string, unknown>,
        is_super: def.is_super,
        is_system: def.is_system,
      })
    }

    return await super.updateRbacRoles({
      id: existing.id,
      name: def.name,
      description: def.description,
      permissions: permissions as unknown as Record<string, unknown>,
      is_super: def.is_super,
      is_system: def.is_system,
    })
  }

  // ── User ↔ role assignments ──────────────────────────────────────────────

  /** List the raw assignment rows for a user. */
  async listUserRoleRecords(userId: string) {
    return await super.listRbacUserRoles({ user_id: userId })
  }

  /** List the full Role objects assigned to a user. */
  async listRolesForUser(userId: string) {
    const assignments = await super.listRbacUserRoles({ user_id: userId })
    if (assignments.length === 0) {
      return []
    }
    return await super.listRbacRoles({
      id: assignments.map((a) => a.role_id),
    })
  }

  /**
   * Assign a role to a user (idempotent — re-assigning is a no-op).
   *
   * @throws {MedusaError} NOT_FOUND when the role does not exist.
   */
  async assignRole(userId: string, roleId: string) {
    if (typeof userId !== "string" || userId.trim().length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "user_id is required"
      )
    }
    // Throws NOT_FOUND when the role is missing.
    await super.retrieveRbacRole(roleId)

    const [existing] = await super.listRbacUserRoles(
      { user_id: userId, role_id: roleId },
      { take: 1 }
    )
    if (existing) {
      return existing
    }

    return await super.createRbacUserRoles({
      id: `urole_${randomUUID()}`,
      user_id: userId,
      role_id: roleId,
    })
  }

  /** Remove a role from a user (no-op when not assigned). */
  async unassignRole(userId: string, roleId: string): Promise<void> {
    const matches = await super.listRbacUserRoles({
      user_id: userId,
      role_id: roleId,
    })
    if (matches.length > 0) {
      await super.deleteRbacUserRoles(matches.map((m) => m.id))
    }
  }

  /** Replace the full set of roles for a user with the supplied role ids. */
  async setUserRoles(userId: string, roleIds: string[]): Promise<void> {
    const desired = new Set(
      Array.isArray(roleIds) ? roleIds.filter((r) => typeof r === "string") : []
    )

    // Validate every requested role exists before mutating anything.
    if (desired.size > 0) {
      const found = await super.listRbacRoles({ id: [...desired] })
      if (found.length !== desired.size) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "One or more roles do not exist"
        )
      }
    }

    const current = await super.listRbacUserRoles({ user_id: userId })
    const currentIds = new Set(current.map((c) => c.role_id))

    const toRemove = current.filter((c) => !desired.has(c.role_id))
    if (toRemove.length > 0) {
      await super.deleteRbacUserRoles(toRemove.map((r) => r.id))
    }

    const toAdd = [...desired].filter((id) => !currentIds.has(id))
    if (toAdd.length > 0) {
      await super.createRbacUserRoles(
        toAdd.map((roleId) => ({
          id: `urole_${randomUUID()}`,
          user_id: userId,
          role_id: roleId,
        }))
      )
    }
  }

  // ── Permission resolution ────────────────────────────────────────────────

  /**
   * Resolve the effective permission context for a user: their role slugs, the
   * union of permission keys across those roles, and whether any role is super.
   */
  async resolvePermissions(userId: string): Promise<ResolvedPermissions> {
    const roles = await this.listRolesForUser(userId)

    const slugs: string[] = []
    const permissionSet = new Set<string>()
    let isSuper = false

    for (const role of roles) {
      slugs.push(role.slug)
      if (role.is_super) {
        isSuper = true
      }
      const perms = Array.isArray(role.permissions)
        ? (role.permissions as unknown[])
        : []
      for (const p of perms) {
        if (isValidPermission(p)) {
          permissionSet.add(p)
        }
      }
    }

    // Baseline reads for any role-holder so the dashboard shell can render.
    // (Super users implicitly have everything, so this only affects non-super
    //  users; users with no roles get nothing and cannot load any data.)
    if (!isSuper && slugs.length > 0) {
      for (const key of BASELINE_PERMISSIONS) {
        permissionSet.add(key)
      }
    }

    return {
      roles: slugs,
      permissions: [...permissionSet],
      isSuper,
    }
  }
}

export default RbacModuleService
