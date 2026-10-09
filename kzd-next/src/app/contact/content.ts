/* Office locations, ported from the Organization JSON-LD and services boxes
   in contact.html. Coordinates are approximate centre points for the two
   addresses, used only to place map markers. */

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
  {
    name: "Durban DUT - ML Sultan Campus",
    address: "Durban University of Technology, ML Sultan Campus, Greyville, Berea, 4023",
    phoneHref: "tel:+27704563015",
    phoneLabel: "(070) 456 3015",
    lat: -29.8317,
    lng: 31.0027,
  },
];
