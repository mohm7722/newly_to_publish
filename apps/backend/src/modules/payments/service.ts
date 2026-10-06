import { randomUUID } from "crypto"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { BankAccount } from "./models/bank-account"
import { CODSettings } from "./models/cod-settings"

/**
 * Field bounds enforced at the service boundary (Requirement 4.1).
 *
 *  - `bank_name`:      text, 1 to 255 characters (non-blank).
 *  - `account_number`: text, 1 to 100 characters (non-blank), unique.
 *  - `currency_code`:  text, 1 to 20 characters, stored EXACTLY as entered with
 *                      no normalization (no trim/uppercase).
 */
const BANK_NAME_MIN_LENGTH = 1
const BANK_NAME_MAX_LENGTH = 255
const ACCOUNT_NUMBER_MIN_LENGTH = 1
const ACCOUNT_NUMBER_MAX_LENGTH = 100
const CURRENCY_CODE_MIN_LENGTH = 1
const CURRENCY_CODE_MAX_LENGTH = 20

/** Filters accepted by {@link PaymentsModuleService.listBankAccounts}. */
export type ListBankAccountsFilters = {
  is_active?: boolean
  currency_code?: string
}

/** Shape accepted by {@link PaymentsModuleService.createBankAccount}. */
export type CreateBankAccountInput = {
  bank_name: string
  account_number: string
  currency_code: string
  instructions?: string | null
  is_active?: boolean
}

/** Shape accepted by {@link PaymentsModuleService.updateBankAccount}. */
export type UpdateBankAccountInput = Partial<{
  bank_name: string
  account_number: string
  currency_code: string
  instructions: string | null
  is_active: boolean
}>

/** Shape accepted by {@link PaymentsModuleService.updateCODSettings}. */
export type UpdateCODSettingsInput = Partial<{
  enabled: boolean
  instructions: string | null
  selected_city_ids: string[] | null
}>

/** Resolved COD settings shape returned by {@link PaymentsModuleService.getCODSettings}. */
export type CODSettingsResult = {
  id?: string
  enabled: boolean
  instructions: string | null
  selected_city_ids: string[] | null
}

/** Sensible defaults returned when no COD settings row exists yet. */
const DEFAULT_COD_SETTINGS: CODSettingsResult = {
  enabled: false,
  instructions: null,
  selected_city_ids: null,
}

/**
 * Validate the bank name (Requirement 4.1).
 *
 * @throws {MedusaError} `INVALID_DATA` when the name is missing, not a string,
 *   blank, or outside the inclusive 1–255 character range.
 */
function validateBankName(bankName: unknown): string {
  if (typeof bankName !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "bank_name is required and must be a string"
    )
  }

  if (bankName.trim().length < BANK_NAME_MIN_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "bank_name must be at least 1 character"
    )
  }

  if (bankName.length > BANK_NAME_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `bank_name must be at most ${BANK_NAME_MAX_LENGTH} characters`
    )
  }

  return bankName
}

/**
 * Validate the account number (Requirement 4.1).
 *
 * @throws {MedusaError} `INVALID_DATA` when the value is missing, not a string,
 *   blank, or outside the inclusive 1–100 character range.
 */
function validateAccountNumber(accountNumber: unknown): string {
  if (typeof accountNumber !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "account_number is required and must be a string"
    )
  }

  if (accountNumber.trim().length < ACCOUNT_NUMBER_MIN_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "account_number must be at least 1 character"
    )
  }

  if (accountNumber.length > ACCOUNT_NUMBER_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `account_number must be at most ${ACCOUNT_NUMBER_MAX_LENGTH} characters`
    )
  }

  return accountNumber
}

/**
 * Validate the currency code (Requirement 4.1).
 *
 * The value is returned **verbatim** — it is never trimmed, uppercased, or
 * otherwise normalized — so the FX currency codes (`YER_NEW`, `YER_OLD`, `SAR`,
 * etc.) are persisted exactly as entered.
 *
 * @throws {MedusaError} `INVALID_DATA` when the value is missing, not a string,
 *   empty, or longer than 20 characters.
 */
function validateCurrencyCode(currencyCode: unknown): string {
  if (typeof currencyCode !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "currency_code is required and must be a string"
    )
  }

  // Length bounds are checked against the raw value (no trimming) so storage
  // remains byte-for-byte identical to the supplied input.
  if (currencyCode.length < CURRENCY_CODE_MIN_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "currency_code must be at least 1 character"
    )
  }

  if (currencyCode.length > CURRENCY_CODE_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `currency_code must be at most ${CURRENCY_CODE_MAX_LENGTH} characters`
    )
  }

  return currencyCode
}

/**
 * Validate the optional instructions field.
 *
 * @throws {MedusaError} `INVALID_DATA` when a non-null/undefined value is not a
 *   string.
 */
function validateInstructions(
  instructions: unknown
): string | null {
  if (instructions === undefined || instructions === null) {
    return null
  }

  if (typeof instructions !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "instructions must be a string when provided"
    )
  }

  return instructions
}

/**
 * PaymentsModuleService.
 *
 * Wires the {@link BankAccount} and {@link CODSettings} models into the
 * idiomatic Medusa 2.16 `MedusaService` factory (Requirement 1.1). Extending
 * the factory generates the standard data-access methods for each model
 * (`listBankAccounts` / `retrieveBankAccount` / `createBankAccounts` /
 * `updateBankAccounts` / `deleteBankAccounts`, and the equivalents for
 * `CODSettings`) mapped onto the existing `bank_accounts` and `cod_settings`
 * tables.
 *
 * On top of those generated primitives this service exposes the named,
 * validated business operations that achieve behavior parity with the Old Store
 * payments service:
 *  - bank accounts: {@link PaymentsModuleService.listBankAccounts},
 *    {@link PaymentsModuleService.createBankAccount},
 *    {@link PaymentsModuleService.updateBankAccount},
 *    {@link PaymentsModuleService.deleteBankAccount},
 *    {@link PaymentsModuleService.toggleBankAccount};
 *  - COD settings (singleton): {@link PaymentsModuleService.getCODSettings},
 *    {@link PaymentsModuleService.updateCODSettings},
 *    {@link PaymentsModuleService.isCodAvailableForCity}.
 *
 * Field validation, the `account_number` uniqueness constraint, and verbatim
 * `currency_code` persistence are enforced at this boundary so invalid or
 * duplicate input is rejected without mutating any existing record
 * (Requirements 4.1, 4.2, 4.3).
 *
 * Generated method names
 * -----------------------
 * `MedusaService` derives its generated list/retrieve/create/update/delete
 * method names from the **factory keys** (verbatim casing, pluralized), not
 * from the `model.define` name. To keep the public, design-named business
 * methods (`listBankAccounts`, `updateCODSettings`, ...) from colliding with
 * the generated CRUD primitives, the models are registered under deliberately
 * distinct alias keys:
 *   - `BankAccountModel` → generated `listBankAccountModels` /
 *     `retrieveBankAccountModel` / `createBankAccountModels` /
 *     `updateBankAccountModels` / `deleteBankAccountModels`.
 *   - `CodSettings` → generated `listCodSettings` / `retrieveCodSetting` /
 *     `createCodSettings` / `updateCodSettings` / `deleteCodSettings`.
 * The public methods below wrap these generated primitives.
 */
class PaymentsModuleService extends MedusaService({
  BankAccountModel: BankAccount,
  CodSettings: CODSettings,
}) {
  /**
   * List bank accounts, optionally filtered by active flag and/or currency
   * code. Results are ordered by `bank_name` ascending for stable output.
   *
   * @param filters Optional `is_active` and/or `currency_code` filters. The
   *   `currency_code` filter matches verbatim (no normalization).
   */
  async listBankAccounts(filters: ListBankAccountsFilters = {}) {
    const where: Record<string, unknown> = {}

    if (typeof filters.is_active === "boolean") {
      where.is_active = filters.is_active
    }

    if (typeof filters.currency_code === "string") {
      where.currency_code = filters.currency_code
    }

    return await super.listBankAccountModels(where, {
      order: { bank_name: "ASC" },
    })
  }

  /**
   * Create a bank account (Requirements 4.1, 4.2, 4.3).
   *
   * Validates every field, persists `currency_code` verbatim, and generates the
   * primary key with `randomUUID()` so the framework never produces a
   * replacement uuid PK for the new row (Requirement 1.3). The `account_number`
   * is checked against existing records **before** any write; a duplicate is
   * rejected with an "account number already exists" error and no record is
   * created or modified (Requirements 4.2, 4.3).
   *
   * @throws {MedusaError} `INVALID_DATA` on invalid field values or a duplicate
   *   `account_number`.
   */
  async createBankAccount(data: CreateBankAccountInput) {
    const bank_name = validateBankName(data.bank_name)
    const account_number = validateAccountNumber(data.account_number)
    const currency_code = validateCurrencyCode(data.currency_code)
    const instructions = validateInstructions(data.instructions)
    const is_active =
      typeof data.is_active === "boolean" ? data.is_active : true

    // Uniqueness check before write: leave existing records untouched on
    // conflict (Requirements 4.2, 4.3).
    await this.assertAccountNumberUnique(account_number)

    return await super.createBankAccountModels({
      id: randomUUID(),
      bank_name,
      account_number,
      currency_code,
      instructions,
      is_active,
    })
  }

  /**
   * Partially update a bank account by id (Requirements 4.1, 4.2, 4.3).
   *
   * Only the supplied fields are changed. When `account_number` is changed to a
   * value already owned by a **different** record, the operation is rejected
   * with the same "account number already exists" error and all records are
   * left unchanged (Requirements 4.2, 4.3). `currency_code` is persisted
   * verbatim when provided.
   *
   * @throws {MedusaError} `NOT_FOUND` when no record with `id` exists.
   * @throws {MedusaError} `INVALID_DATA` on invalid field values or a duplicate
   *   `account_number`.
   */
  async updateBankAccount(id: string, data: UpdateBankAccountInput) {
    // Throws NOT_FOUND when the record does not exist.
    const existing = await this.retrieveBankAccountModel(id)

    const update: Record<string, unknown> = { id }

    if (data.bank_name !== undefined) {
      update.bank_name = validateBankName(data.bank_name)
    }

    if (data.account_number !== undefined) {
      const account_number = validateAccountNumber(data.account_number)
      if (account_number !== existing.account_number) {
        await this.assertAccountNumberUnique(account_number, id)
      }
      update.account_number = account_number
    }

    if (data.currency_code !== undefined) {
      update.currency_code = validateCurrencyCode(data.currency_code)
    }

    if (data.instructions !== undefined) {
      update.instructions = validateInstructions(data.instructions)
    }

    if (data.is_active !== undefined) {
      update.is_active = data.is_active
    }

    return await super.updateBankAccountModels(update)
  }

  /**
   * Delete a bank account by id.
   *
   * @throws {MedusaError} `NOT_FOUND` when no record with `id` exists.
   */
  async deleteBankAccount(id: string): Promise<void> {
    // Throws NOT_FOUND when the record does not exist.
    await this.retrieveBankAccountModel(id)
    await super.deleteBankAccountModels(id)
  }

  /**
   * Toggle the active flag of a bank account by id (retrieve current, write the
   * inverse).
   *
   * @throws {MedusaError} `NOT_FOUND` when no record with `id` exists.
   */
  async toggleBankAccount(id: string) {
    const existing = await this.retrieveBankAccountModel(id)

    return await super.updateBankAccountModels({
      id,
      is_active: !existing.is_active,
    })
  }

  /**
   * Assert that no **other** bank account already owns `accountNumber`
   * (Requirements 4.2, 4.3). Used as a pre-write guard by create/update.
   *
   * @param accountNumber The (already validated) account number to check.
   * @param excludeId An optional record id to exclude from the conflict check
   *   (the record being updated).
   * @throws {MedusaError} `INVALID_DATA` when a conflicting record exists.
   */
  private async assertAccountNumberUnique(
    accountNumber: string,
    excludeId?: string
  ): Promise<void> {
    const matches = await super.listBankAccountModels({
      account_number: accountNumber,
    })

    const conflict = matches.some((m) => m.id !== excludeId)
    if (conflict) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `A bank account with the account number "${accountNumber}" already exists`
      )
    }
  }

  /**
   * Read the singleton COD settings row (Requirements 4.4).
   *
   * Follows Old Store singleton semantics: returns the first (and only) row when
   * present, otherwise returns sensible defaults
   * (`{ enabled: false, instructions: null, selected_city_ids: null }`) without
   * creating a row.
   */
  async getCODSettings(): Promise<CODSettingsResult> {
    const [row] = await super.listCodSettings({}, { take: 1 })

    if (!row) {
      return { ...DEFAULT_COD_SETTINGS }
    }

    return {
      id: row.id,
      enabled: Boolean(row.enabled),
      instructions: row.instructions ?? null,
      selected_city_ids: normalizeCityIds(row.selected_city_ids),
    }
  }

  /**
   * Upsert the singleton COD settings row (Requirement 4.4).
   *
   * Updates the existing row when present; otherwise creates one with a
   * `randomUUID()` primary key so the framework never generates a replacement
   * uuid PK (Requirement 1.3). Only the supplied fields are changed on update.
   */
  async updateCODSettings(
    data: UpdateCODSettingsInput
  ): Promise<CODSettingsResult> {
    const [existing] = await super.listCodSettings({}, { take: 1 })

    const enabled =
      data.enabled !== undefined
        ? Boolean(data.enabled)
        : existing
          ? Boolean(existing.enabled)
          : DEFAULT_COD_SETTINGS.enabled

    const instructions =
      data.instructions !== undefined
        ? validateInstructions(data.instructions)
        : existing
          ? (existing.instructions ?? null)
          : DEFAULT_COD_SETTINGS.instructions

    const selected_city_ids =
      data.selected_city_ids !== undefined
        ? normalizeCityIds(data.selected_city_ids)
        : existing
          ? normalizeCityIds(existing.selected_city_ids)
          : DEFAULT_COD_SETTINGS.selected_city_ids

    if (existing) {
      const updated = await super.updateCodSettings({
        id: existing.id,
        enabled,
        instructions,
        // `selected_city_ids` is a jsonb column holding a `string[]`; the
        // generated type narrows json to `Record<string, unknown>`, so cast
        // the array through `unknown` for the write.
        selected_city_ids: selected_city_ids as unknown as
          | Record<string, unknown>
          | null,
      })
      const row = Array.isArray(updated) ? updated[0] : updated
      return {
        id: row.id,
        enabled: Boolean(row.enabled),
        instructions: row.instructions ?? null,
        selected_city_ids: normalizeCityIds(row.selected_city_ids),
      }
    }

    const created = await super.createCodSettings({
      id: randomUUID(),
      enabled,
      instructions,
      // jsonb column holding a `string[]`; cast through `unknown` (see above).
      selected_city_ids: selected_city_ids as unknown as
        | Record<string, unknown>
        | null,
    })
    const row = Array.isArray(created) ? created[0] : created
    return {
      id: row.id,
      enabled: Boolean(row.enabled),
      instructions: row.instructions ?? null,
      selected_city_ids: normalizeCityIds(row.selected_city_ids),
    }
  }

  /**
   * Determine whether COD is available for a given (optional) shipping city
   * (Requirements 4.7, 4.8).
   *
   * COD is available **only** when the singleton settings have `enabled === true`
   * AND one of:
   *   - `selected_city_ids` is null/empty → COD is available for **all** cities;
   *   - the resolved `cityId` is a member of `selected_city_ids`.
   *
   * When a non-empty city restriction is configured and `cityId` is
   * unset/undefined (or not a member), COD is excluded (Requirement 4.8).
   *
   * The settings are loaded internally so callers need only supply the cart's
   * resolved shipping city id.
   */
  async isCodAvailableForCity(cityId?: string): Promise<boolean> {
    const settings = await this.getCODSettings()

    if (!settings.enabled) {
      return false
    }

    const restriction = settings.selected_city_ids
    // No restriction configured → available for every city.
    if (!restriction || restriction.length === 0) {
      return true
    }

    // A restriction exists: an unset city cannot satisfy membership.
    if (cityId === undefined || cityId === null) {
      return false
    }

    return restriction.includes(cityId)
  }
}

/**
 * Coerce a stored `selected_city_ids` value into a clean `string[]` or `null`.
 *
 * The column is `jsonb` and may come back as `null`, an array, or (defensively)
 * a JSON-encoded string. Non-array values normalize to `null`; arrays are
 * filtered to string members.
 */
function normalizeCityIds(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return null
  }

  let parsed: unknown = value
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return null
    }
  }

  if (!Array.isArray(parsed)) {
    return null
  }

  return parsed.filter((id): id is string => typeof id === "string")
}

export default PaymentsModuleService
