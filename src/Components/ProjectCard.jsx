import { motion } from "framer-motion"
import { ArrowBigUpDashIcon } from 'lucide-react'
const ProjectCard = () => {
    return (
        <>
            <div className="mb-12">
                <h1 className="text-7xl font-bold mb-4">RECENT</h1>
                <h2 className="text-7xl font-bold text-gray-700 mb-8">PROJECTS</h2>
                <p className="text-gray-400 text-xl max-w-2xl">
                    Passionate about creating intuitive and engaging user experiences.
                    Specialize in transforming ideas into beautifully crafted products.
                </p>
            </div>
            <div >
                <motion.div whileHover={{ scale: 1.02 }} >
                    <div className="flex justify-between gap-4 hover:bg-gray-900 p-6 rounded-lg hover:scale-[1.02]">
                        <div className="h-38 w-48 overflow-hidden rounded-lg">
                            <img src='https://framerusercontent.com/images/0Mi0IWlbWJU3AYT2hGFzEwO4Ku8.png?scale-down-to=512' alt="" />
                        </div>
                        <div className="space-y-1">
                            <h2 className='text-7xl font-bold '>Revo</h2>
                            <p className='text-xl'>FreeFrame Template fvsdfvdfvsdf</p>
                        </div>
                        <div className="justify-items-end">
                            <ArrowBigUpDashIcon className='text-orange-500' />
                        </div>
                    </div>
                </motion.div>
            </div>
            <div >
                <motion.div whileHover={{ scale: 1.02 }} >
                    <div className="flex justify-between hover:bg-gray-900 p-6 rounded-lg hover:scale-[1.02]">
                        <div className=" h-38 w-48 overflow-hidden rounded-lg">
                            <img src='https://framerusercontent.com/images/0Mi0IWlbWJU3AYT2hGFzEwO4Ku8.png?scale-down-to=512' alt="" />
                        </div>
                        <div className="space-y-1">
                            <h2 className='text-7xl font-bold '>Revo</h2>
                            <p className='text-xl'>FreeFrame Template fvsdfvdfvsdf</p>
                        </div>
                        <div className="justify-items-end">
                            <ArrowBigUpDashIcon className='text-orange-500' />
                        </div>
                    </div>
                </motion.div>
            </div>
            <div >
                <motion.div whileHover={{ scale: 1.02 }} >
                    <div className="flex justify-between gap-8 hover:bg-gray-900 p-6 rounded-lg hover:scale-[1.02]">
                        <div className=" h-38 w-48 overflow-hidden rounded-lg">
                            <img src='https://framerusercontent.com/images/0Mi0IWlbWJU3AYT2hGFzEwO4Ku8.png?scale-down-to=512' alt="" />
                        </div>
                        <div className="space-y-1">
                            <h2 className='text-7xl font-bold '>Revo</h2>
                            <p className='text-xl'>FreeFrame Template fvsdfvdfvsdf</p>
                        </div>
                        <div className="justify-items-end">
                            <ArrowBigUpDashIcon className='text-orange-500' />
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    )
}

export default ProjectCard