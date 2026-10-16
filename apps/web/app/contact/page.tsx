import { Nav } from "../_nav";
import ContactForm from "./_form";

export default function Contact() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Contact</h1>
      <ContactForm />
    </main>
  );
}
