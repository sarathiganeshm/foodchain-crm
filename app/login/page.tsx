'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { fadeUp, staggerContainer } from '@/lib/animations';

const STAT_PILLS = [
  { label: '10.2M tonnes wasted/yr', delay: 0 },
  { label: '£19BN economic cost', delay: 0.4 },
  { label: '270,000t retail waste', delay: 0.8 },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-[#030712] overflow-hidden">
      {/* ── Left: Spline scene ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Ambient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-[#030712] to-[#030712]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" />

        {/* Spline */}
        <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
            targetOpacity={0.8}
          />
        </div>

        {/* Bottom attribution */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">
            Powered by IoT &amp; AI
          </p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative px-6 py-12">
        {/* Glass card wrapper */}
        <div className="relative w-full max-w-md glass rounded-2xl p-8 border border-[#1F2937]">
          {/* Spotlight */}
          <Spotlight size={500} />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Logo */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center glow-amber">
                <Wheat className="w-5 h-5 text-amber-400" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent tracking-tight">
                FoodChain CRM
              </span>
            </motion.div>

            {/* Title */}
            <motion.div variants={fadeUp} className="space-y-2">
              <h1 className="text-3xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
                  Supply Chain
                </span>
                <br />
                <span className="text-white">Intelligence</span>
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Reducing UK food waste through intelligent supply chain management
              </p>
            </motion.div>

            {/* Stat pills */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {STAT_PILLS.map((pill) => (
                <div
                  key={pill.label}
                  className="animate-float px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/8 text-amber-300 text-xs font-mono tracking-tight"
                  style={{ animationDelay: `${pill.delay}s` }}
                >
                  {pill.label}
                </div>
              ))}
            </motion.div>

            {/* Divider */}
            <motion.div variants={fadeUp} className="h-px bg-gradient-to-r from-transparent via-[#1F2937] to-transparent" />

            {/* Email input */}
            <motion.div variants={fadeUp} className="space-y-2">
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
                Email address
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-300 ${
                  emailFocused
                    ? 'border-amber-500/60 glow-amber bg-[#0F172A]'
                    : 'border-[#1F2937] bg-[#0F172A]'
                }`}
              >
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@foodchain.co.uk"
                  aria-label="Email address"
                  className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 outline-none rounded-xl"
                />
              </div>
            </motion.div>

            {/* Password input */}
            <motion.div variants={fadeUp} className="space-y-2">
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
                Password
              </label>
              <div
                className={`relative rounded-xl border transition-all duration-300 ${
                  passwordFocused
                    ? 'border-amber-500/60 glow-amber bg-[#0F172A]'
                    : 'border-[#1F2937] bg-[#0F172A]'
                }`}
              >
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••••••"
                  aria-label="Password"
                  className="w-full bg-transparent px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 outline-none rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={fadeUp}>
              <motion.button
                onClick={handleLogin}
                disabled={isLoading}
                aria-label="Enter FoodChain CRM"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full relative overflow-hidden cursor-pointer rounded-xl py-3.5 px-6 font-semibold text-sm text-[#030712] bg-gradient-to-r from-amber-400 to-amber-500 glow-amber flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-5 h-5 border-2 border-[#030712]/40 border-t-[#030712] rounded-full animate-spin"
                    />
                  ) : (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      Enter FoodChain CRM
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Forgot password */}
            <motion.div variants={fadeUp} className="text-center">
              <button
                type="button"
                aria-label="Forgot password"
                className="text-xs text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-8 text-center text-xs text-gray-600 max-w-xs leading-relaxed"
        >
          By signing in you agree to our{' '}
          <span className="text-amber-600 hover:text-amber-400 cursor-pointer transition-colors">Terms of Service</span>
          {' '}and{' '}
          <span className="text-amber-600 hover:text-amber-400 cursor-pointer transition-colors">Privacy Policy</span>
          . FoodChain CRM — Fighting UK food waste since 2024.
        </motion.p>
      </div>
    </div>
  );
}
