/** A category node used by the nav/side-menu/mega-menu (parent with children). */
export type NavCategory = {
  id: string
  name: string
  handle: string
  children: { id: string; name: string; handle: string }[]
}
