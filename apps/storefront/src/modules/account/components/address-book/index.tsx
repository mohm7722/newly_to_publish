import React from "react"
import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = { customer: HttpTypes.StoreCustomer; region: HttpTypes.StoreRegion }

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => (
  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
    <AddAddress region={region} addresses={customer.addresses} />
    {customer.addresses.map((address) => (
      <EditAddress region={region} address={address} key={address.id} />
    ))}
  </div>
)

export default AddressBook
