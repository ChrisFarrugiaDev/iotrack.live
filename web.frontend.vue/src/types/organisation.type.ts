export interface Organisation {


  id: string,
  uuid: string, 
  name: string,
  parent_org_id?: string,
  can_inherit_key?: boolean,

}