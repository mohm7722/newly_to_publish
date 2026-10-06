import { Container, Heading, Text } from "@medusajs/ui"
import { useMyPermissions } from "../../lib/use-my-permissions"

/**
 * "No access" landing page.
 *
 * Shown to authenticated admins that have not been granted any role. It exports
 * no `config`, so it does not appear in the navigation menu; the access guard
 * redirects here. The page itself only reads `/admin/rbac/me` (allow-listed),
 * so it renders even with zero permissions.
 */
const NoAccessPage = () => {
  const { data } = useMyPermissions()

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-y-4 text-center">
      <Heading level="h1">لا تملك صلاحيات الوصول</Heading>
      <Text className="text-ui-fg-subtle max-w-md">
        حسابك مُصادق عليه لكنه غير مرتبط بأي دور بعد. لا يمكنك عرض أي بيانات أو
        تنفيذ أي عملية حتى يقوم مدير النظام بتعيين دور لك.
      </Text>
      {data?.email && (
        <Text size="small" className="text-ui-fg-muted">
          {data.email}
        </Text>
      )}
    </Container>
  )
}

export default NoAccessPage
