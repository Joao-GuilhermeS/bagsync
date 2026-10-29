export type ActiveWorkshop={bag_id:string;workshop_id:string;remaining_quantity:string};
export function activeWorkshopCount(rows:readonly ActiveWorkshop[],models:readonly {id:string}[]):number {
 const ids=new Set(models.map(model=>model.id));return new Set(rows.filter(row=>ids.has(row.bag_id)&&BigInt(row.remaining_quantity.split(".")[0])>BigInt(0)).map(row=>row.workshop_id)).size;
}
