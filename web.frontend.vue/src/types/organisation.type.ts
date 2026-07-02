export interface Organisation {

  id: string,
  uuid: string,
  name: string,
  parent_org_id?: string,
  can_inherit_maps_key?: boolean,
  can_inherit_ai_key?: boolean,

}