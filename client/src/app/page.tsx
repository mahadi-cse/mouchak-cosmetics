import {
  Features,
  FeaturedProducts,
  Footer,
  Header,
  Hero,
  Newsletter,
} from "@/modules/homepage";

export default function HomePage() {
  return (
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
  );
}
