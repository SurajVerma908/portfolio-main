import { motion } from "framer-motion"

const Card = () => {
  return (
    <div>
        <div className="max-w-6xl mx-auto mt-20 mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className=" overflow-hidden rounded-2xl bg-[#FF4500] p-8 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                DYNAMIC ANIMATION,
                <br />
                MOTION DESIGN
              </h3>
              <div className="mt-auto">
                <motion.div
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                  whileHover={{ x: 10 }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className=" overflow-hidden rounded-2xl bg-[#B4FF4A] p-8 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col h-full text-black">
              <div className="mb-4">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6h16v12H4V6zm2 2v8h12V8H6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                FRAMER, FIGMA,
                <br />
                WORDPRESS, REACTJS
              </h3>
              <div className="mt-auto">
                <motion.div
                  className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center"
                  whileHover={{ x: 10 }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
    </div>
  )
}

export default Card