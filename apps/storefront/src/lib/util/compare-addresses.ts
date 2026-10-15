import { isEqual, pick } from "lodash"

/**
 * Compares the address fields the checkout actually collects. `company` and
 * `postal_code` are intentionally excluded: checkout no longer gathers them, so
 * including them would make a saved account address (which may carry a company
 * or postal code) never match the checkout form input.
 */
const COMPARED_FIELDS = [
  "first_name",
  "last_name",
  "address_1",
  "city",
  "country_code",
  "province",
  "phone",
]

export default function compareAddresses(address1: object, address2: object) {
  return isEqual(pick(address1, COMPARED_FIELDS), pick(address2, COMPARED_FIELDS))
}
