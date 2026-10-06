import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShieldCheck } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { adminFetch } from "../../../lib/admin-fetch"

/**
 * Roles & permissions management page.
 *
 * Full dynamic control over roles: create custom roles, edit any non-super
 * role's name/description/permissions, and delete custom (non-system) roles.
 * Wired to:
 *  - `GET    /admin/rbac/roles`
 *  - `POST   /admin/rbac/roles`
 *  - `POST   /admin/rbac/roles/:id`   (update)
 *  - `DELETE /admin/rbac/roles/:id`
 *  - `GET    /admin/rbac/permissions` (catalog for the picker)
 */

type Role = {
  id: string
  name: string
  slug: string
  description: string | null
  permissions: string[]
  is_super: boolean
  is_system: boolean
}

type PermissionDef = {
  key: string
  group: string
  label: string
  description: string
}

type RoleForm = {
  name: string
  slug: string
  description: string
  permissions: string[]
}

const EMPTY_FORM: RoleForm = {
  name: "",
  slug: "",
  description: "",
  permissions: [],
}

const ROLES_KEY = ["admin", "rbac", "roles"] as const
const PERMS_KEY = ["admin", "rbac", "permissions"] as const

const RolesPage = () => {
  const queryClient = useQueryClient()

  const [editor, setEditor] = useState<{
    open: boolean
    editing: Role | null
    form: RoleForm
  }>({ open: false, editing: null, form: EMPTY_FORM })

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const rolesQuery = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => adminFetch<{ roles: Role[] }>("/admin/access/roles"),
  })

  const permsQuery = useQuery({
    queryKey: PERMS_KEY,
    queryFn: () =>
      adminFetch<{ permissions: PermissionDef[]; groups: Record<string, string> }>(
        "/admin/access/permissions"
      ),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ROLES_KEY })

  const saveMutation = useMutation({
    mutationFn: async (form: RoleForm) => {
      const payload = {
        name: form.name,
        description: form.description.trim().length > 0 ? form.description : null,
        permissions: form.permissions,
      }
      if (editor.editing) {
        return adminFetch(`/admin/access/roles/${editor.editing.id}`, {
          method: "POST",
          body: payload,
        })
      }
      return adminFetch("/admin/access/roles", {
        method: "POST",
        body: { ...payload, slug: form.slug },
      })
    },
    onSuccess: async () => {
      await refresh()
      toast.success(editor.editing ? "تم تحديث الدور" : "تم إنشاء الدور")
      setEditor({ open: false, editing: null, form: EMPTY_FORM })
    },
    onError: (err: Error) =>
      toast.error("تعذّر الحفظ", { description: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: (role: Role) =>
      adminFetch(`/admin/access/roles/${role.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم حذف الدور")
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error("تعذّر الحذف", { description: err.message })
      setDeleteTarget(null)
    },
  })

  const groupedPermissions = useMemo(() => {
    const perms = permsQuery.data?.permissions ?? []
    const groups = permsQuery.data?.groups ?? {}
    const map = new Map<string, PermissionDef[]>()
    for (const p of perms) {
      const list = map.get(p.group) ?? []
      list.push(p)
      map.set(p.group, list)
    }
    return [...map.entries()].map(([group, items]) => ({
      group,
      label: groups[group] ?? group,
      items,
    }))
  }, [permsQuery.data])

  const openCreate = () =>
    setEditor({ open: true, editing: null, form: EMPTY_FORM })

  const openEdit = (role: Role) =>
    setEditor({
      open: true,
      editing: role,
      form: {
        name: role.name,
        slug: role.slug,
        description: role.description ?? "",
        permissions: [...role.permissions],
      },
    })

  const setForm = (partial: Partial<RoleForm>) =>
    setEditor((prev) => ({ ...prev, form: { ...prev.form, ...partial } }))

  const togglePermission = (key: string, checked: boolean) =>
    setEditor((prev) => {
      const set = new Set(prev.form.permissions)
      if (checked) {
        set.add(key)
      } else {
        set.delete(key)
      }
      return { ...prev, form: { ...prev.form, permissions: [...set] } }
    })

  const toggleGroup = (items: PermissionDef[], checked: boolean) =>
    setEditor((prev) => {
      const set = new Set(prev.form.permissions)
      for (const it of items) {
        if (checked) {
          set.add(it.key)
        } else {
          set.delete(it.key)
        }
      }
      return { ...prev, form: { ...prev.form, permissions: [...set] } }
    })

  const roles = rolesQuery.data?.roles ?? []
  const isSuperEditing = editor.editing?.is_super === true

  // For create, a valid lowercase snake_case slug is required.
  const slugValid = /^[a-z][a-z0-9_]*$/.test(editor.form.slug)
  const formValid =
    editor.form.name.trim().length > 0 && (editor.editing ? true : slugValid)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">الأدوار والصلاحيات</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            إدارة أدوار المستخدمين الإداريين وصلاحياتهم
          </Text>
        </div>
        <Button variant="primary" onClick={openCreate}>
          إضافة دور
        </Button>
      </div>

      {rolesQuery.isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      )}

      {rolesQuery.isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل الأدوار: {(rolesQuery.error as Error)?.message}
          </Text>
        </div>
      )}

      {!rolesQuery.isLoading && !rolesQuery.isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>الدور</Table.HeaderCell>
              <Table.HeaderCell>المعرّف</Table.HeaderCell>
              <Table.HeaderCell>عدد الصلاحيات</Table.HeaderCell>
              <Table.HeaderCell>النوع</Table.HeaderCell>
              <Table.HeaderCell className="text-right">إجراءات</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.map((role) => (
              <Table.Row key={role.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <Text weight="plus">{role.name}</Text>
                    {role.description && (
                      <Text size="small" className="text-ui-fg-subtle">
                        {role.description}
                      </Text>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small">{role.slug}</Badge>
                </Table.Cell>
                <Table.Cell>
                  {role.is_super ? "الكل" : role.permissions.length}
                </Table.Cell>
                <Table.Cell>
                  {role.is_super ? (
                    <Badge color="purple" size="small">
                      مدير النظام
                    </Badge>
                  ) : role.is_system ? (
                    <Badge color="blue" size="small">
                      افتراضي
                    </Badge>
                  ) : (
                    <Badge color="green" size="small">
                      مخصّص
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={role.is_super}
                      onClick={() => openEdit(role)}
                    >
                      {role.is_super ? "مقفل" : "تعديل"}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      disabled={role.is_system}
                      onClick={() => setDeleteTarget(role)}
                    >
                      حذف
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
              disabled={!formValid || isSuperEditing}
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(editor.form)}
            >
              حفظ
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center overflow-y-auto py-8">
            <div className="flex w-full max-w-2xl flex-col gap-y-6">
              <Heading level="h2">
                {editor.editing ? "تعديل الدور" : "إضافة دور"}
              </Heading>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="role_name">اسم الدور</Label>
                <Input
                  id="role_name"
                  value={editor.form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  placeholder="مثال: مدير المبيعات"
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="role_slug">المعرّف (slug)</Label>
                <Input
                  id="role_slug"
                  value={editor.form.slug}
                  disabled={!!editor.editing}
                  onChange={(e) => setForm({ slug: e.target.value })}
                  placeholder="sales_manager"
                />
                {!editor.editing && !slugValid && editor.form.slug.length > 0 && (
                  <Text size="small" className="text-ui-fg-error">
                    أحرف إنجليزية صغيرة وأرقام و _ فقط، ويبدأ بحرف.
                  </Text>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="role_desc">الوصف</Label>
                <Textarea
                  id="role_desc"
                  value={editor.form.description}
                  onChange={(e) => setForm({ description: e.target.value })}
                  placeholder="وصف مختصر لمسؤوليات هذا الدور"
                />
              </div>

              <div className="flex flex-col gap-y-4">
                <Label>الصلاحيات</Label>
                {permsQuery.isLoading && (
                  <Text className="text-ui-fg-subtle">جارٍ تحميل الصلاحيات…</Text>
                )}
                {groupedPermissions.map(({ group, label, items }) => {
                  const allChecked = items.every((it) =>
                    editor.form.permissions.includes(it.key)
                  )
                  return (
                    <div
                      key={group}
                      className="flex flex-col gap-y-2 rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-x-2">
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={(c) => toggleGroup(items, c === true)}
                          id={`grp_${group}`}
                        />
                        <Label htmlFor={`grp_${group}`} weight="plus">
                          {label}
                        </Label>
                      </div>
                      <div className="grid grid-cols-1 gap-2 ps-6 md:grid-cols-2">
                        {items.map((p) => (
                          <div key={p.key} className="flex items-center gap-x-2">
                            <Checkbox
                              id={p.key}
                              checked={editor.form.permissions.includes(p.key)}
                              onCheckedChange={(c) =>
                                togglePermission(p.key, c === true)
                              }
                            />
                            <Label htmlFor={p.key} size="small">
                              {p.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      <Prompt
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>حذف الدور</Prompt.Title>
            <Prompt.Description>
              هل تريد حذف الدور "{deleteTarget?.name ?? ""}"؟ سيُزال من جميع
              المستخدمين المعيّنين به.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>إلغاء</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget)
                }
              }}
            >
              حذف
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "الأدوار والصلاحيات",
  icon: ShieldCheck,
})

export default RolesPage
