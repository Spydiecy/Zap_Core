"use client";

import React, { useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { cn } from "@/lib/utils";
import {
  IconShieldLock,
  IconBrain,
  IconBolt,
  IconGauge,
  IconCode,
  IconAlertTriangle,
  IconReportAnalytics,
  IconCloudComputing,
  IconFileCode,
  IconRobot,
  IconTestPipe,
  IconCube,
  IconChevronRight,
  IconStar,
  IconStarFilled,
  IconCopy,
  IconExternalLink,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandDiscord,
  IconBrandTelegram,
} from "@tabler/icons-react";

const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const offset = 80; // Account for fixed navbar height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

function HeroSplineBackground() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      pointerEvents: 'auto',
      overflow: 'hidden',
    }}>
      <Spline
        style={{
          width: '100%',
          height: '100vh',
          pointerEvents: 'auto',
        }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: `
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.9))
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function ScreenshotSection({ screenshotRef }: { screenshotRef: React.MutableRefObject<HTMLDivElement | null> }) {
  return (
    <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 -mb-48 mt-24">
      <div ref={screenshotRef} className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 w-full md:w-[80%] lg:w-[70%] mx-auto">
        <div>
          <img
            src="/hero.png"
            alt="Astra X Layer AI Assistant"
            className="w-full h-auto block rounded-lg mx-auto"
          />
        </div>
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="text-white px-4 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-16">
      <div className="w-full lg:w-1/2 pr-0 lg:pr-8 mb-8 lg:mb-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          AI-Powered<br />Blockchain<br/>Assistant for <br/><span className="text-blue-400">X Layer</span>
        </h1>
        <div className="text-sm text-gray-400 tracking-wider">
          INTELLIGENT AGENT · REAL-TIME ANALYSIS · X LAYER NETWORK
        </div>
      </div>

      <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col items-start">
         <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-xl leading-relaxed">
           Experience the power of AI-driven blockchain interactions on X Layer Testnet with OKB token support
        </p>
        <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <a href="/dashboard" className="bg-white text-black font-medium py-3 px-8 rounded-full transition duration-300 hover:bg-gray-100 flex items-center justify-center w-full sm:w-auto text-sm">
               <span className="text-cyan-500 mr-2 text-lg font-bold">+</span>
               Get Started
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-black border border-gray-800 text-white font-medium py-3 px-8 rounded-full transition duration-300 w-full sm:w-auto hover:bg-gray-900 flex items-center justify-center text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Follow Us
            </a>
        </div>
      </div>
    </div>
  );
}

const HeroSection = () => {
  const screenshotRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;

          if (screenshotRef.current) {
            screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`;
          }

          const maxScroll = 400;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
             heroContentRef.current.style.opacity = opacity.toString();
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground />
        </div>

        <div ref={heroContentRef} style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none'
        }}>
          <HeroContent />
        </div>
      </div>

      <div className="bg-black relative z-10" style={{ marginTop: '-15vh' }}>
        <ScreenshotSection screenshotRef={screenshotRef} />
      </div>
    </div>
  );
};

// Add type definitions
interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Chain {
  id: number;
  name?: string;
  icon?: string;
}

interface Audit {
  id: number;
  contractHash?: string;
  rating?: number;
  summary?: string;
  auditor?: string;
  timestamp?: number;
}

const workflowSteps: Step[] = [
  {
    title: "Connect Wallet",
    description: "Connect your X Layer wallet to access AI-powered blockchain assistance",
    icon: <IconFileCode className="w-8 h-8" />,
  },
  {
    title: "AI Analysis",
    description: "Our advanced AI analyzes blockchain data and provides intelligent insights",
    icon: <IconRobot className="w-8 h-8" />,
  },
  {
    title: "Real-time Monitoring",
    description: "Monitor your OKB transactions and token balances in real-time",
    icon: <IconReportAnalytics className="w-8 h-8" />,
  },
  {
    title: "Smart Interactions",
    description: "Execute blockchain operations through natural language commands",
    icon: <IconTestPipe className="w-8 h-8" />,
  },
  {
    title: "Portfolio Management",
    description: "Manage your X Layer portfolio with AI-driven recommendations",
    icon: <IconCube className="w-8 h-8" />,
  },
  {
    title: "Secure Trading",
    description: "Trade tokens safely on X Layer with AI security validation",
    icon: <IconShieldLock className="w-8 h-8" />,
  },
];

const supportedChains: Chain[] = [
  { id: 1, name: "X Layer Testnet", icon: "/okb.png" },
];

const latestFeatures: any[] = [
  { id: 1, title: "Real-time Balance Tracking", description: "Monitor OKB and token balances" },
  { id: 2, title: "AI Transaction Analysis", description: "Intelligent transaction insights" },
  { id: 3, title: "Portfolio Optimization", description: "AI-driven investment suggestions" },
];

const AuditCard = ({ feature }: { feature: any }) => {
  return (
    <div className="group relative">
      {/* Card Background */}
      <div className="relative bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 transition-all duration-300 group-hover:border-blue-500/50 p-6">
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl" />
        
        {/* Content */}
        <div className="relative">
          {/* Feature Title */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
              {feature.title}
            </h3>
            <div className="text-neutral-500 hover:text-blue-400 transition-colors">
              <IconBolt className="w-5 h-5" />
            </div>
          </div>

          {/* Description */}
          <p className="text-neutral-300 mb-6">
            {feature.description}
          </p>

          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400">Active</span>
              </div>
            </div>
            <div className="flex items-center text-neutral-400 hover:text-blue-400 transition-colors cursor-pointer">
              Learn More
              <IconChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Glowing Effect */}
      <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
    </div>
  );
};

const Footer = () => {
  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Networks", href: "#chains" },
      { name: "AI Chat", href: "/dashboard" },
      { name: "Documentation", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "License", href: "#" },
    ],
    social: [
      { name: "Twitter", href: "#", icon: IconBrandTwitter },
      { name: "GitHub", href: "#", icon: IconBrandGithub },
      { name: "Discord", href: "#", icon: IconBrandDiscord },
      { name: "Telegram", href: "#", icon: IconBrandTelegram },
    ],
  };

  return (
    <footer className="relative z-10 border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-20">
          {/* Logo and Social */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-4">
              <a href="#" className="group">
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300" />
                  
                  {/* Logo Container */}
                  <div className="relative flex items-center bg-black border border-neutral-800 group-hover:border-blue-500/50 px-4 py-2 rounded-lg transition duration-300">
                    {/* AI Icon */}
                    <div className="mr-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                      <IconBrain className="w-6 h-6" />
                    </div>
                    
                    {/* Text */}
                    <span className="text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300 group-hover:from-blue-400 group-hover:to-white transition duration-300">
                      ASTRA X LAYER
                    </span>
                  </div>
                </div>
              </a>
            </div>
            <div className="flex items-center space-x-6">
              {links.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                >
                  <item.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {links.product.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {links.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                {links.legal.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Newsletter</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Stay updated with our latest X Layer features and releases.
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors duration-300 text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm">
              © 2025 Astra X Layer. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                Privacy Policy
              </a>
              <span className="text-neutral-600">·</span>
              <a href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export function HomeSections() {
  const features = [
    {
      title: "AI-Powered Analysis",
      description:
        "Advanced blockchain analysis powered by AI models, providing comprehensive insights for X Layer network.",
      icon: <IconBrain className="w-6 h-6" />,
    },
    {
      title: "Real-time Monitoring",
      description:
        "Live monitoring of OKB transactions, token balances, and network activity on X Layer Testnet.",
      icon: <IconReportAnalytics className="w-6 h-6" />,
    },
    {
      title: "Smart Interactions",
      description:
        "Natural language processing for blockchain operations, making X Layer accessible to everyone.",
      icon: <IconCode className="w-6 h-6" />,
    },
    {
      title: "Secure Wallet Integration",
      description: 
        "Seamless wallet connectivity with advanced security features for X Layer network operations.",
      icon: <IconShieldLock className="w-6 h-6" />,
    },
    {
      title: "X Layer Optimized",
      description: 
        "Specifically designed and optimized for X Layer Testnet with OKB token support and OKX integration.",
      icon: <IconBolt className="w-6 h-6" />,
    },
    {
      title: "Portfolio Insights",
      description:
        "AI-driven portfolio analysis and recommendations for your X Layer token holdings and investments.",
      icon: <IconAlertTriangle className="w-6 h-6" />,
    },
    {
      title: "Gas Optimization",
      description:
        "Smart gas optimization for X Layer transactions, helping you save on transaction fees.",
      icon: <IconGauge className="w-6 h-6" />,
    },
    {
      title: "Cloud Infrastructure",
      description: 
        "Enterprise-grade cloud infrastructure ensuring reliable AI assistance for X Layer operations.",
      icon: <IconCloudComputing className="w-6 h-6" />,
    },
  ];

  return (
    <section className="relative pt-24 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="relative z-10">
        {/* Features Header */}
        <div id="features" className="relative text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
            PLATFORM<br />
            <span className="text-blue-400">FEATURES</span>
          </h2>
          <div className="text-xs text-gray-400 tracking-wider mb-6">
            ANALYZE · MONITOR · OPTIMIZE · SECURE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>

        <div id="how-it-works">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                AI BLOCKCHAIN<br />
                <span className="text-blue-400">WORKFLOW</span>
              </h2>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                CONNECT · ANALYZE · INTERACT · OPTIMIZE
              </div>
            </div>

            {/* Steps Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800/30">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative group bg-black"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content */}
                  <div className="relative p-8 border-neutral-800 group-hover:border-blue-500/20 transition-colors duration-300">
                    {/* Step Number */}
                    <div className="absolute top-6 right-8 text-7xl font-bold text-neutral-800/20 group-hover:text-blue-500/10 transition-colors duration-300">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    
                    {/* Icon */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative h-12 w-12 flex items-center justify-center bg-neutral-900 rounded-lg text-blue-400 group-hover:text-blue-300 transition-all duration-300">
                        {step.icon}
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Left Border Accent */}
                    <div className="absolute left-0 top-8 h-8 w-0.5 bg-neutral-800 group-hover:bg-blue-500 group-hover:h-16 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="chains">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                NETWORKS<br />
                <span className="text-blue-400">SUPPORTED</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
                Currently supporting X Layer Testnet with full OKB token integration
              </p>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                SECURE · SCALABLE · FAST · RELIABLE
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
                🚀 Mainnet integration coming soon!
              </div>
            </div>

            {/* Chains Grid */}
            <div className="relative flex justify-center">
              {supportedChains.map((chain) => (
                <div
                  key={chain.id}
                  className="group relative bg-black/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-black/70 transition-all duration-300 border border-neutral-800/50 hover:border-blue-500/50 max-w-sm"
                >
                  {/* Card Background with Gradient */}
                  <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 transition-all duration-300 group-hover:border-blue-500/50">
                    {/* Hover Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl" />
                  </div>

                  {/* Content Container */}
                  <div className="relative h-full flex flex-col items-center justify-center text-center">
                    {/* X Layer Logo */}
                    <div className="w-20 h-20 bg-neutral-800 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                      {chain.icon ? (
                        <img 
                          src={chain.icon} 
                          alt={chain.name} 
                          className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300 text-xl font-bold">
                          XL
                        </div>
                      )}
                    </div>

                    {/* Network Name */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                      {chain.name}
                    </h3>
                    
                    {/* Status Badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm mb-4">
                      🟢 Live & Active
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed">
                      AI-powered blockchain assistance on X Layer Testnet with full OKB token support and OKX integration
                    </p>
                  </div>

                  {/* Glowing Effect */}
                  <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              ))}
            </div>

            {/* Coming Soon Section */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                <span className="text-blue-400 font-mono text-sm">MAINNET</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 text-sm">Coming Q2 2025</span>
              </div>
            </div>
          </div>
        </div>

        <div id="features-showcase">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                KEY<br />
                <span className="text-blue-400">FEATURES</span>
              </h2>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                INTELLIGENT · SECURE · FAST · RELIABLE
              </div>
            </div>

            {/* Features Grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
              {latestFeatures.map((feature) => (
                <AuditCard key={feature.id} feature={feature} />
              ))}
            </div>

            {/* View All Button */}
            <div className="relative mt-16 text-center">
              <a href="/dashboard" className="inline-flex items-center justify-center px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full border border-neutral-800 hover:border-blue-500/50 transition-all duration-300 group">
                <span className="mr-2">Try AI Assistant</span>
                <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l border-neutral-800",
        index < 4 && "lg:border-b border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

export { HeroSection };
