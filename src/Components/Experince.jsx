import { motion } from "framer-motion"
import { ArrowBigUpDashIcon } from 'lucide-react'

const Experince = () => {
    return (
        <>
            <div className="mb-12">
                <h1 className="text-7xl font-bold mb-4">12 YEARS OF</h1>
                <h2 className="text-7xl font-bold text-gray-700 mb-8">EXPERIENCE</h2>

            </div>
            <div>
                <motion.div whileHover={{ scale: 1.02 }}>
                    <div className="flex justify-between items-center gap-8 hover:bg-gray-900 p-6 rounded-lg">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-bold">Ninja Infosys Pvt. Ltd.</h2>
                            <p className="text-lg text-gray-500 mt-4">Led the design team in creating
                                user-centric mobile and web applications, improving the user experience
                                and increasing user engagement.
                            </p>
                            <p className="text-lg text-gray-500 mt-4">Jan 2021-Present
    
                            </p>
                        </div>
                        <ArrowBigUpDashIcon className="text-orange-500 h-8 w-8" />
                    </div>
                </motion.div>
            </div>
            <div>
                <motion.div whileHover={{ scale: 1.02 }}>
                    <div className="flex justify-between items-center gap-8 hover:bg-gray-900 p-6 rounded-lg">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-bold">Ninja Infosys Pvt. Ltd.</h2>
                            <p className="text-lg text-gray-500 mt-4">Led the design team in creating
                                user-centric mobile and web applications, improving the user experience
                                and increasing user engagement.
                            </p>
                            <p className="text-lg text-gray-500 mt-4">Jan 2021-Present
    
                            </p>
                        </div>
                        <ArrowBigUpDashIcon className="text-orange-500 h-8 w-8" />
                    </div>
                </motion.div>
            </div>
            <div>
                <motion.div whileHover={{ scale: 1.02 }}>
                    <div className="flex justify-between items-center gap-8 hover:bg-gray-900 p-6 rounded-lg">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-bold">Ninja Infosys Pvt. Ltd.</h2>
                            <p className="text-lg text-gray-500 mt-4">Led the design team in creating
                                user-centric mobile and web applications, improving the user experience
                                and increasing user engagement.
                            </p>
                            <p className="text-lg text-gray-500 mt-4">Jan 2021-Present
    
                            </p>
                        </div>
                        <ArrowBigUpDashIcon className="text-orange-500 h-8 w-8" />
                    </div>
                </motion.div>
            </div>
           



        </>
    )
}

export default Experince