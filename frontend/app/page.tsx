import { HeroSection } from "@/components/blocks/hero-section-1"
import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee"

const testimonials = [
  {
    text: "ASTRA has completely revolutionized how I interact with X Layer Network. One command and I can deploy contracts instantly!",
    author: {
      name: "Sarah Chen",
      handle: "@sarahdev",
      imageSrc: "/testimonials/1.jpg",
    },
  },
  {
    text: "The AI agent understands exactly what I need. Payment scheduling has never been this simple on blockchain.",
    author: {
      name: "Michael Rodriguez", 
      handle: "@mike_blockchain",
      imageSrc: "/testimonials/2.jpg",
    },
  },
  {
    text: "From token creation to NFT minting, ASTRA makes complex operations feel like casual conversation.",
    author: {
      name: "Emily Zhang",
      handle: "@emily_crypto", 
      imageSrc: "/testimonials/3.jpg",
    },
  },
];

export default function Home() {
  return (
    <div>
      <HeroSection />
      <TestimonialsSection 
        title="Trusted by X Layer Developers"
        description="See what developers are saying about ASTRA's AI-powered blockchain interactions"
        testimonials={testimonials}
      />
    </div>
  );
}
