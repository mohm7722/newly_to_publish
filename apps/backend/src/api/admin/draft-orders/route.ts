import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  OrderStatus,
} from "@medusajs/framework/utils"
import { createOrderWorkflow } from "@medusajs/medusa/core-flows"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../modules/settlement"

/**
 * Fields read from the core draft-order entity for the thin wrapper response.
 * Kept intentionally small — the wrapper does not reshape or recompute core
 * order totals, it only surfaces them alongside settlement metadata.
 */
const DRAFT_ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "total",
  "created_at",
  "updated_at",
  "metadata",
]

/**
 * Read a page of core draft orders through the framework Query graph.
 *
 * Medusa exposes draft orders as core order records flagged with
 * `is_draft_order`. We query the `order` entity filtered to draft orders, which
 * is the same contract the core admin draft-orders list route uses.
 */
async function listCoreDraftOrders(
  req: MedusaRequest,
  limit: number,
  offset: number
): Promise<Array<Record<string, any>>> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "order",
    fields: DRAFT_ORDER_FIELDS,
    filters: { is_draft_order: true } as Record<string, unknown>,
    pagination: { skip: offset, take: limit },
  })

  return (data ?? []) as Array<Record<string, any>>
}

/**
 * GET /admin/draft-orders
 *
 * Thin wrapper over the CORE draft-order system (Requirements 3.1, 3.4, 8.1,
 * 8.3): it lists core draft orders via the framework Query graph and enriches
 * each with its settlement row from the Settlement module. The wrapper never
 * mutates core order totals — it merges the persisted `order_settlement` rows
 * into each draft order under a `settlement` key (or `null` when none exists).
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const limit = Math.max(1, Number(req.query.limit) || 20)
    const offset = Math.max(0, Number(req.query.offset) || 0)

    const draftOrders = await listCoreDraftOrders(req, limit, offset)

    const orderIds = draftOrders
      .map((draftOrder) => draftOrder.id)
      .filter((id): id is string => typeof id === "string")

    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const { items } = await settlementService.getMany(orderIds)
    const settlementByOrderId = new Map(
      (items as Array<{ order_id: string }>).map((row) => [row.order_id, row])
    )

    const draft_orders = draftOrders.map((draftOrder) => ({
      ...draftOrder,
      settlement: settlementByOrderId.get(draftOrder.id) ?? null,
    }))

    res.status(200).json({ draft_orders })
  } catch (error) {
    res.status(500).json({ message: "Failed to list draft orders" })
  }
}

/**
 * POST /admin/draft-orders
 *
 * Delegates draft-order creation to the CORE `createOrderWorkflow`
 * (Requirements 3.1, 3.4, 8.1) — flagged as a draft order, exactly as the core
 * admin route does. We do NOT reimplement draft orders with carts; the core
 * draft-order system is the source of truth.
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const input = (req.body as Record<string, any>) || {}

    const { result } = await createOrderWorkflow(req.scope).run({
      input: {
        ...input,
        status: OrderStatus.DRAFT,
        is_draft_order: true,
      } as any,
    })

    res.status(200).json({ draft_order: result })
  } catch (error) {
    if (error instanceof MedusaError) {
      if (error.type === MedusaError.Types.INVALID_DATA) {
        res.status(400).json({ message: error.message })
        return
      }
      if (error.type === MedusaError.Types.NOT_FOUND) {
        res.status(404).json({ message: error.message })
        return
      }
    }
    res.status(500).json({ message: "Failed to create draft order" })
  }
}
