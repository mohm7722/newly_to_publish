import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

/**
 * Product image-labels widget.
 *
 * Injected at the `product.details.after` zone of the admin product detail
 * page. It lets an administrator attach a short descriptive label to each
 * product image (e.g. "المينا والأرقام", "الحزام", "آلية الفتح والغلق").
 *
 * Medusa's standard product-image payload only accepts `{ id, url }` (no
 * per-image metadata through the HTTP validator), so the labels are stored on
 * the product itself under `product.metadata.image_labels` as a map keyed by
 * the image URL (`{ [imageUrl]: label }`). Keying by URL keeps the labels
 * stable even if image ids change, and the storefront reads the same map from
 * `product.metadata` to render each caption.
 */

/** Metadata key holding the `{ [imageUrl]: label }` map. */
const IMAGE_LABELS_KEY = "image_labels"

/** Common label suggestions offered to the administrator. */
const LABEL_SUGGESTIONS = [
  "المنتج كامل",
  "المينا والأرقام",
  "الحزام",
  "آلية الفتح والغلق",
  "اللون",
  "الشكل والنوع",
  "المقاس والأبعاد",
  "التفاصيل الخلفية",
]

type ProductImage = { id: string; url: string }

type ProductResponse = {
  product: {
    id: string
    thumbnail: string | null
    images: ProductImage[] | null
    metadata: Record<string, unknown> | null
  }
}

const productImagesQueryKey = (productId: string) => [
  "product-image-labels",
  productId,
]

/** Fetch the product's images and metadata. */
async function fetchProductImages(
  productId: string
): Promise<ProductResponse["product"]> {
  const res = await fetch(
    `/admin/products/${productId}?fields=id,thumbnail,metadata,*images`,
    { credentials: "include" }
  )
  if (!res.ok) {
    throw new Error("تعذّر تحميل صور المنتج")
  }
  const json = (await res.json()) as ProductResponse
  return json.product
}

/** Read the stored `{ [imageUrl]: label }` map from product metadata. */
function readLabels(
  metadata: Record<string, unknown> | null | undefined
): Record<string, string> {
  const raw = metadata?.[IMAGE_LABELS_KEY]
  if (raw && typeof raw === "object") {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === "string") {
        out[key] = value
      }
    }
    return out
  }
  return {}
}

/** Persist the labels map back to `product.metadata`, preserving other keys. */
async function saveLabels(
  productId: string,
  existingMetadata: Record<string, unknown> | null | undefined,
  labels: Record<string, string>
): Promise<void> {
  // Drop empty labels so we never store blank captions.
  const cleaned: Record<string, string> = {}
  for (const [url, label] of Object.entries(labels)) {
    const trimmed = label.trim()
    if (trimmed.length > 0) {
      cleaned[url] = trimmed
    }
  }

  const nextMetadata = {
    ...(existingMetadata ?? {}),
    [IMAGE_LABELS_KEY]: cleaned,
  }

  const res = await fetch(`/admin/products/${productId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: nextMetadata }),
  })

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    throw new Error(json.message || json.error || "تعذّر حفظ التسميات")
  }
}

const ProductImageLabelsWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const productId = product.id
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: productImagesQueryKey(productId),
    queryFn: () => fetchProductImages(productId),
  })

  // Local editable state keyed by image URL.
  const [labels, setLabels] = useState<Record<string, string>>({})

  // Seed local state from the fetched metadata once loaded.
  useEffect(() => {
    if (data) {
      setLabels(readLabels(data.metadata))
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: () => saveLabels(productId, data?.metadata, labels),
    onSuccess: async () => {
      toast.success("تم حفظ تسميات الصور")
      await queryClient.invalidateQueries({
        queryKey: productImagesQueryKey(productId),
      })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "تعذّر حفظ التسميات"
      )
    },
  })

  const images = data?.images ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">تسميات الصور</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            أضف وصفًا قصيرًا لكل صورة يظهر للزبون في صفحة المنتج.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          isLoading={mutation.isPending}
          disabled={mutation.isPending || isLoading || isError || !images.length}
          onClick={() => mutation.mutate()}
        >
          حفظ
        </Button>
      </div>

      {/* Shared suggestions surfaced through a native datalist. */}
      <datalist id="image-label-suggestions">
        {LABEL_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            جارٍ التحميل…
          </Text>
        ) : isError ? (
          <Text size="small" className="text-ui-fg-error">
            تعذّر تحميل صور المنتج.
          </Text>
        ) : images.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            لا توجد صور لهذا المنتج بعد. ارفع الصور من قسم "الوسائط" أولًا.
          </Text>
        ) : (
          <div className="flex flex-col gap-y-4">
            {images.map((image) => (
              <div key={image.id} className="flex items-center gap-x-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="صورة المنتج"
                  className="h-16 w-16 flex-none rounded-md object-cover bg-ui-bg-subtle"
                />
                <div className="flex-1">
                  <Input
                    list="image-label-suggestions"
                    placeholder="مثال: المينا والأرقام"
                    value={labels[image.url] ?? ""}
                    onChange={(e) =>
                      setLabels((prev) => ({
                        ...prev,
                        [image.url]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductImageLabelsWidget
