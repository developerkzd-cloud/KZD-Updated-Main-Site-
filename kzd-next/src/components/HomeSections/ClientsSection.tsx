/* Our clients — endless, swipeable browser-window cards with a preview
   modal. Shared by / and /services, identical on both. */

import { CLIENTS } from "@/app/services/content";
import ClientsCarousel from "./ClientsCarousel";
import styles from "./HomeSections.module.css";

export default function ClientsSection() {
  return (
    <section className={styles.clients} aria-labelledby="home-clients-title">
      <div className={styles.clientsHead}>
        <p className={styles.secEyebrow}>Our clients</p>
        <h2 className={styles.clientsTitle} id="home-clients-title">
          Live sites, real businesses.
        </h2>
        <p className={styles.clientsSub}>Real businesses across South Africa, running on sites we built.</p>
      </div>
      <ClientsCarousel clients={CLIENTS} />
    </section>
  );
}
