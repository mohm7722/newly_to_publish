import React from "react"
import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import type { StoreCity } from "@lib/data/cities"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
  cities: StoreCity[]
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region, cities }) => (
  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
    <AddAddress region={region} addresses={customer.addresses} cities={cities} />
    {customer.addresses.map((address) => (
      <EditAddress region={region} address={address} cities={cities} key={address.id} />
    ))}
  </div>
)

export default AddressBook
