import {
  Features,
  FeaturedProducts,
  Footer,
  Header,
  Hero,
  Newsletter,
  HomepageLocaleProvider,
} from "@/modules/homepage";

export default function HomePage() {
  return (
    <HomepageLocaleProvider defaultLocale="en">
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <main>
          <Hero />
          <Features />
          <FeaturedProducts />
          <Newsletter />
        </main>

        <Footer />
      </div>
    </HomepageLocaleProvider>
  );
}
