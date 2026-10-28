export type WorkshopContact={name:string;phone:string;street:string;address_number:string;address_complement:string;neighborhood:string;city:string;state:string;postal_code:string};
export function workshopContact(workshop:WorkshopContact){
 const address=[workshop.street,workshop.address_number,workshop.address_complement,workshop.neighborhood,[workshop.city,workshop.state].filter(Boolean).join(" / "),workshop.postal_code].filter(Boolean).join(", ");
 const digits=workshop.phone.replace(/\D/g,"");
 const valid=digits.length>=8&&digits.length<=15;
 const international=workshop.phone.trim().startsWith("+")?digits:/^55\d{10,11}$/.test(digits)?digits:/^\d{10,11}$/.test(digits)?`55${digits}`:null;
 return {address,map:address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`:null,telephone:valid?`tel:${workshop.phone.trim().startsWith("+")?"+":""}${digits}`:null,whatsapp:valid&&international?`https://wa.me/${international}`:null};
}
