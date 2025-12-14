import React from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Shield, Rocket, Check, ArrowRight, Menu, X, Star, Users, Image as ImageIcon, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: MessageSquare,
      title: "Chat Interface",
      description: "Berinteraksi dengan AI seperti berbicara dengan teman. Kelola percakapan dalam berbagai chat threads."
    },
    {
      icon: ImageIcon,
      title: "AI Image Generation",
      description: "Generate gambar berkualitas tinggi dengan AI terbaik. Dari fotorealistik hingga artistic style."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Proses generation super cepat dengan priority queue untuk user premium. Hasil dalam hitungan detik."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Data Anda terenkripsi dengan standar enterprise. Privacy adalah prioritas utama kami."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "/bulan",
      description: "Sempurna untuk mencoba",
      features: [
        "10 generations/hari",
        "Resolusi standar (1024x1024)",
        "5 chat aktif maksimal",
        "Chat auto-delete 30 hari",
        "Community support"
      ],
      cta: "Mulai Gratis",
      href: "/register",
      popular: false,
      color: "from-gray-600 to-gray-700"
    },
    {
      name: "Pro",
      price: "Rp 99.000",
      period: "/bulan",
      description: "Untuk profesional & creator",
      features: [
        "500 generations/hari",
        "Resolusi tinggi hingga 4K",
        "Unlimited active chats",
        "Chat tersimpan 90 hari",
        "Priority generation queue",
        "Advanced AI models",
        "No watermark",
        "Email support 24/7"
      ],
      cta: "Upgrade ke Pro",
      href: "/register",
      popular: true,
      color: "from-purple-600 to-pink-600"
    },
    {
      name: "Enterprise",
      price: "Rp 499.000",
      period: "/bulan",
      description: "Untuk tim & bisnis",
      features: [
        "Unlimited generations",
        "Resolusi maksimal 8K",
        "Unlimited chats selamanya",
        "Custom AI model training",
        "API access",
        "Team collaboration",
        "Dedicated account manager",
        "Priority support 24/7"
      ],
      cta: "Hubungi Sales",
      href: "/contact",
      popular: false,
      color: "from-yellow-600 to-orange-600"
    }
  ];

  const stats = [
    { icon: Users, value: "50K+", label: "Active Users" },
    { icon: ImageIcon, value: "2M+", label: "Images Generated" },
    { icon: MessageSquare, value: "500K+", label: "Conversations" },
    { icon: Star, value: "4.9/5", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ArtifyAI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
              <a href="#about" className="hover:text-purple-400 transition-colors">About</a>
              <Link href="/login" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                Sign In
              </Link>
              <Link href="/register" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
              <span className="text-purple-300 text-sm font-semibold">✨ Next-Generation AI Art Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Create Stunning AI Art in
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent"> Seconds</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Transform your ideas into breathtaking visuals with the power of AI. 
              Chat interface, unlimited creativity, professional results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/50">
                Start Creating Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#features" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl font-bold text-lg transition-all border border-white/20">
                View Examples
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all group">
                    <Icon className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to create amazing AI-generated content</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Choose the plan that fits your creative needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div key={idx} className={`relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border transition-all hover:-translate-y-2 ${plan.popular ? 'border-purple-500 shadow-lg shadow-purple-500/50 scale-105' : 'border-white/10 hover:border-purple-500/30'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-400 mb-2">{plan.period}</span>
                  </div>
                </div>

                <Link href={plan.href} className={`block w-full py-3 rounded-xl font-bold mb-6 text-center transition-all bg-gradient-to-r ${plan.color} hover:shadow-lg`}>
                  {plan.cta}
                </Link>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-12 border border-purple-500/30">
            <Rocket className="w-16 h-16 mx-auto mb-6 text-purple-400" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Create Magic?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of creators and start generating stunning AI art today. No credit card required.
            </p>
            <Link href="/register" className="inline-block px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/50">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold">ArtifyAI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transform your imagination into reality with AI-powered image generation.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <a href="#features" className="block hover:text-purple-400">Features</a>
                <a href="#pricing" className="block hover:text-purple-400">Pricing</a>
                <Link href="/docs" className="block hover:text-purple-400">API</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <Link href="/about" className="block hover:text-purple-400">About</Link>
                <Link href="/blog" className="block hover:text-purple-400">Blog</Link>
                <Link href="/contact" className="block hover:text-purple-400">Contact</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <Link href="/privacy" className="block hover:text-purple-400">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-purple-400">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} ArtifyAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
