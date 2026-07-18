import Hero from "../components/Hero";
import EditorialMarquee from "../components/EditorialMarquee";
import Divisions from "../components/Divisions";
import Manifesto from "../components/Manifesto";
import HomeGallery from "../components/HomeGallery";
import FeaturedWorks from "../components/FeaturedWorks";
import Testimonials from "../components/Testimonials";
import ConsultButton from "../components/ConsultButton";
import { Rise } from "../components/Rise";
import Head from "../components/Head";
import { ANCHORS } from "../lib/seo";
import { useSEOFor } from "../lib/useSiteSettings";

export default function HomePage() {
  const seo = useSEOFor({ sectionKey: "home" });
  return (
    <main data-testid="home-page">
      <Head
        title={seo.title}
        description={seo.description}
        canonical="https://caremanto.in/"
        keywords={seo.keywords}
        image={seo.image}
      />
      <Hero />
      <EditorialMarquee />
      <Divisions />
      <HomeGallery />
      <Manifesto />
      <FeaturedWorks />
      <Testimonials />

      {/* Closing quote strip */}
      <section className="relative bg-[var(--bg-1)] py-24 md:py-36 border-t border-[var(--line)]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-14 text-center">
          <Rise>
            <div className="overline mb-8">A Note From the Studio</div>
          </Rise>
          <Rise delay={100}>
            <blockquote className="font-serif italic text-[clamp(1.6rem,3.6vw,3rem)] leading-[1.15] tracking-tight text-[var(--ink)]/95">
              "Good rooms are quiet arguments —<br />
              made in stone, timber, light and time."
            </blockquote>
          </Rise>
          <Rise delay={200}>
            <div className="mt-10 flex justify-center">
              <ConsultButton testId="home-final-cta" />
            </div>
          </Rise>
        </div>
      </section>
    </main>
  );
}
