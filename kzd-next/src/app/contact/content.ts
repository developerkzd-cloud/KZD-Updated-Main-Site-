/* The office: KZD Solutions is based at Smart Xchange, Durban. Kept as a
   list so another office is a data edit. */

export type Location = {
  name: string;
  address: string;
  phoneHref: string;
  phoneLabel: string;
  lat: number;
  lng: number;
};

export const LOCATIONS: Location[] = [
  {
    name: "Durban, Smart Xchange",
    address: "3rd Floor, Convention House, 125 Bram Fischer Rd, Durban Central, Durban, 4000",
    phoneHref: "tel:+27310053129",
    phoneLabel: "(031) 005 3129",
    lat: -29.8579,
    lng: 31.0292,
  },
];
