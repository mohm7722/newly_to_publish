import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  FocusModal,
  Heading,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminFetch } from "../../../lib/admin-fetch"

/**
 * Admin users management page.
 *
 * Lists admin users, assigns/removes roles, and enables/disables accounts.
 * Wired to:
 *  - `GET  /admin/rbac/users`
 *  - `POST /admin/rbac/users/:id/roles`   (replace role set)
 *  - `POST /admin/rbac/users/:id/disable` ({ disabled })
 *  - `GET  /admin/rbac/roles`             (available roles for the picker)
 */

type RoleRef = { id: string; name: string; slug: string }

type AdminUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  disabled: boolean
  roles: RoleRef[]
}

type Role = {
  id: string
  name: string
  slug: string
  is_super: boolean
  is_system: boolean
}

const USERS_KEY = ["admin", "rbac", "users"] as const
const ROLES_KEY = ["admin", "rbac", "roles"] as const

const UsersPage = () => {
  const queryClient = useQueryClient()

  const [editor, setEditor] = useState<{
    open: boolean
    user: AdminUser | null
    roleIds: string[]
  }>({ open: false, user: null, roleIds: [] })

  const usersQuery = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => adminFetch<{ users: AdminUser[] }>("/admin/access/users"),
  })

  const rolesQuery = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => adminFetch<{ roles: Role[] }>("/admin/access/roles"),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: USERS_KEY })

  const saveRolesMutation = useMutation({
    mutationFn: (vars: { userId: string; roleIds: string[] }) =>
      adminFetch(`/admin/access/users/${vars.userId}/roles`, {
        method: "POST",
        body: { role_ids: vars.roleIds },
      }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم تحديث أدوار المستخدم")
      setEditor({ open: false, user: null, roleIds: [] })
    },
    onError: (err: Error) =>
      toast.error("تعذّر تحديث الأدوار", { description: err.message }),
  })

  const disableMutation = useMutation({
    mutationFn: (vars: { userId: string; disabled: boolean }) =>
      adminFetch(`/admin/access/users/${vars.userId}/disable`, {
        method: "POST",
        body: { disabled: vars.disabled },
      }),
    onSuccess: async (_data, vars) => {
      await refresh()
      toast.success(vars.disabled ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم")
    },
    onError: (err: Error) =>
      toast.error("تعذّر تغيير حالة المستخدم", { description: err.message }),
  })

  const openEditor = (user: AdminUser) =>
    setEditor({
      open: true,
      user,
      roleIds: user.roles.map((r) => r.id),
    })

  const toggleRole = (roleId: string, checked: boolean) =>
    setEditor((prev) => {
      const set = new Set(prev.roleIds)
      if (checked) {
        set.add(roleId)
      } else {
        set.delete(roleId)
      }
      return { ...prev, roleIds: [...set] }
    })

  const users = usersQuery.data?.users ?? []
  const roles = rolesQuery.data?.roles ?? []

  const fullName = (u: AdminUser) =>
    [u.first_name, u.last_name].filter(Boolean).join(" ") || "—"

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">المستخدمون الإداريون</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            تعيين الأدوار وتعطيل/تفعيل حسابات المستخدمين
          </Text>
        </div>
      </div>

      {usersQuery.isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      )}

      {usersQuery.isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل المستخدمين: {(usersQuery.error as Error)?.message}
          </Text>
        </div>
      )}

      {!usersQuery.isLoading && !usersQuery.isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>البريد الإلكتروني</Table.HeaderCell>
              <Table.HeaderCell>الاسم</Table.HeaderCell>
              <Table.HeaderCell>الأدوار</Table.HeaderCell>
              <Table.HeaderCell>الحالة</Table.HeaderCell>
              <Table.HeaderCell className="text-right">إجراءات</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>{fullName(user)}</Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <Text size="small" className="text-ui-fg-subtle">
                        لا أدوار
                      </Text>
                    ) : (
                      user.roles.map((r) => (
                        <Badge key={r.id} size="small">
                          {r.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={user.disabled ? "red" : "green"} size="small">
                    {user.disabled ? "معطّل" : "نشط"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openEditor(user)}
                    >
                      الأدوار
                    </Button>
                    <Button
                      variant={user.disabled ? "secondary" : "danger"}
                      size="small"
                      isLoading={
                        disableMutation.isPending &&
                        disableMutation.variables?.userId === user.id
                      }
                      onClick={() =>
                        disableMutation.mutate({
                          userId: user.id,
                          disabled: !user.disabled,
                        })
                      }
                    >
                      {user.disabled ? "تفعيل" : "تعطيل"}
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <FocusModal
        open={editor.open}
        onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Button
              variant="primary"
              isLoading={saveRolesMutation.isPending}
              onClick={() => {
                if (editor.user) {
                  saveRolesMutation.mutate({
                    userId: editor.user.id,
                    roleIds: editor.roleIds,
                  })
                }
              }}
            >
              حفظ
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center overflow-y-auto py-8">
            <div className="flex w-full max-w-lg flex-col gap-y-6">
              <Heading level="h2">أدوار المستخدم</Heading>
              {editor.user && (
                <Text className="text-ui-fg-subtle" size="small">
                  {editor.user.email}
                </Text>
              )}

              <div className="flex flex-col gap-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center gap-x-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      id={`role_${role.id}`}
                      checked={editor.roleIds.includes(role.id)}
                      onCheckedChange={(c) => toggleRole(role.id, c === true)}
                    />
                    <Label htmlFor={`role_${role.id}`} className="flex-1">
                      {role.name}
                    </Label>
                    {role.is_super && (
                      <Badge color="purple" size="small">
                        مدير النظام
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "المستخدمون والأدوار",
  icon: Users,
})

export default UsersPage
