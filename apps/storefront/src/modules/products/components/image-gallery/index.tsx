import { HttpTypes } from "@medusajs/types"
import { Container, Text } from "@modules/common/components/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /**
   * Optional map of image URL → descriptive label, sourced from
   * `product.metadata.image_labels`. When a label exists for an image it is
   * shown as a caption beneath it and used as the image's alt text.
   */
  imageLabels?: Record<string, string>
}

const ImageGallery = ({ images, imageLabels = {} }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative">
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {images.map((image, index) => {
          const label = image.url ? imageLabels[image.url] : undefined
          return (
            <div key={image.id} className="flex flex-col gap-y-2">
              <Container
                className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#fcfafc]"
                id={image.id}
              >
                {!!image.url && (
                  <Image
                    src={image.url}
                    priority={index <= 2 ? true : false}
                    className="absolute inset-0 rounded-2xl"
                    alt={label || `صورة المنتج ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 700px"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                )}
              </Container>
              {label && (
                <Text
                  className="text-center text-small-regular text-ui-fg-subtle"
                  data-testid="product-image-label"
                >
                  {label}
                </Text>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
