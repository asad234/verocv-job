"use client"
import { motion } from "framer-motion"
import { useAnimateInView } from "@/hooks/useAnimateInView"
import Link from "next/link"

export default function CtaSection() {
  const { ref, isInView } = useAnimateInView()

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-600 text-white">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { scale: 0.8, opacity: 0 },
            visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
          }}
          ref={ref}
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Set up personalized job search alerts
            </h2>
            <p className="mx-auto max-w-[700px] text-blue-100 md:text-xl/relaxed lg:text-xl/relaxed">
              Get notified when new jobs matching your criteria are posted
            </p>
          </div>
          <motion.div
            className="w-full max-w-md space-y-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
          >
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors"
              >
                Sign Up
              </button>
            </form>
            <p className="text-xs text-blue-200">
              We&apos;ll never share your email. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}