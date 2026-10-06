"use client"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = { customer: HttpTypes.StoreCustomer }

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <AccountInfo
      label="البريد الإلكتروني"
      currentInfo={<bdi dir="ltr" className="font-semibold" data-testid="current-info">{customer.email}</bdi>}
      clearState={() => undefined}
      data-testid="account-email-editor"
    />
  )
}

export default ProfileEmail
