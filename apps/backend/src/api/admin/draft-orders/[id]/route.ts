import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  deleteDraftOrdersWorkflow,
  updateDraftOrderWorkflow,
} from "@medusajs/medusa/core-flows"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../modules/settlement"

/**
 * Fields read from the core draft-order entity for the thin wrapper response.
 * The wrapper does not reshape or recompute core order totals.
 */
const DRAFT_ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "total",
  "subtotal",
  "shipping_total",
  "tax_total",
  "discount_total",
  "items.*",
  "created_at",
  "updated_at",
  "metadata",
]

/**
 * Read a single core draft order by id through the framework Query graph.
 *
 * Draft orders are core order records flagged with `is_draft_order`, so we read
 * the `order` entity filtered by `id` + the draft flag — the same contract the
 * core admin route uses.
 */
async function getCoreDraftOrder(
  req: MedusaRequest,
  id: string
): Promise<Record<string, any> | null> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "order",
    fields: DRAFT_ORDER_FIELDS,
    filters: { id, is_draft_order: true } as Record<string, unknown>,
  })

  return ((data ?? [])[0] as Record<string, any>) ?? null
}

/**
 * GET /admin/draft-orders/:id
 *
 * Thin wrapper over the CORE draft-order system (Requirements 3.1, 3.4, 8.1,
 * 8.3): reads a single core draft order via the framework Query graph and
 * merges in its settlement metadata. Returns a `404` when the draft order
 * cannot be found. The wrapper never mutates core order totals — it only
 * attaches the persisted `order_settlement` row under a `settlement` key (or
 * `null` when none exists).
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    const draftOrder = await getCoreDraftOrder(req, id)

    if (!draftOrder) {
      res.status(404).json({ message: "Draft order not found" })
      return
    }

    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const settlement = await settlementService.getSettlement(id)

    res.status(200).json({ draft_order: { ...draftOrder, settlement } })
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve draft order" })
  }
}

/**
 * PUT /admin/draft-orders/:id
 *
 * Delegates draft-order updates to the CORE `updateDraftOrderWorkflow`
 * (Requirements 3.1, 3.4, 8.1). We do NOT reimplement draft orders with carts;
 * the core draft-order system is the source of truth.
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function PUT(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const input = (req.body as Record<string, any>) || {}
    const userId = (req.auth_context?.actor_id as string) || input.user_id

    const { result } = await updateDraftOrderWorkflow(req.scope).run({
      input: {
        ...input,
        id,
        user_id: userId,
      } as any,
    })

    res.status(200).json({ draft_order: result })
  } catch (error) {
    if (error instanceof MedusaError) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        res.status(404).json({ message: error.message })
        return
      }
      if (error.type === MedusaError.Types.INVALID_DATA) {
        res.status(400).json({ message: error.message })
        return
      }
    }
    res.status(500).json({ message: "Failed to update draft order" })
  }
}

/**
 * DELETE /admin/draft-orders/:id
 *
 * Delegates draft-order deletion to the CORE `deleteDraftOrdersWorkflow`
 * (Requirements 3.1, 3.4, 8.1). We do NOT reimplement draft orders with carts;
 * the core draft-order system is the source of truth.
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    await deleteDraftOrdersWorkflow(req.scope).run({
      input: { order_ids: [id] },
    })

    res.status(200).json({ id, object: "draft-order", deleted: true })
  } catch (error) {
    if (error instanceof MedusaError) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        res.status(404).json({ message: error.message })
        return
      }
    }
    res.status(500).json({ message: "Failed to delete draft order" })
  }
}
