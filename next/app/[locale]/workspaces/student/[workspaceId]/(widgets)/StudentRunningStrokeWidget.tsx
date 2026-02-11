'use client'

import {
  useState,
  useEffect
} from 'react'
import {
  motion,
  AnimatePresence
} from 'framer-motion'

const cards = [
  "🎉 Welcome to our platform!",
  "🚀 New features coming soon",
  "💡 Did you know? You can customize your dashboard",
  "📢 Join our community events",
  "✨ Check out our latest updates"
]

export function StudentRunningStrokeWidget() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === cards.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change card every 5 seconds

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-dark text-white overflow-hidden h-10 w-full rounded">
      <div className="flex items-center h-full px-4">
        <div className="shrink-0 mr-3">
          📢
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="whitespace-nowrap"
          >
            {cards[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
