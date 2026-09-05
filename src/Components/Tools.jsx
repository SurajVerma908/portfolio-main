import { motion } from "framer-motion"
const images = [
    {
        id: 1,
        title: ' PHP Laravel',
        description: 'Backend',
        logo: '/images/download.jpg',

    },
    {
        id: 2,
        title: 'Inertia Js',
        description: "Backend",
        logo: '/images/inertia.png',
    },
    {
        id: 3,
        title: 'React',
        description: "Frontend",
        logo: '/images/react.png',
    },

    {
        id: 4,
        title: 'Tailwind',
        description: "Frontend",
        logo: '/images/tailwind.jpg',
    },
    {
        id: 5,
        title: 'HTML',
        description: "Frontend",
        logo: '/images/html.webp',
    },
    {
        id: 6,
        title: 'CSS',
        description: "Frontend",
        logo: '/images/css.png',
    },
    {
        id: 7,
        title: 'Javascript',
        description: "Frontend",
        logo: '/images/js.png',
    },

]
const tools=[
    {
        id:1,
        title:'Postman',
        description:'Api Testing',
        logo:'/images/post.png'
    }
]
const Tools = () => {
    return (
        <>
            <div className="mb-12">
                <h1 className="text-7xl font-bold mb-4">TECHNICAL</h1>
                <h2 className="text-7xl font-bold text-gray-700 mb-8">TOOLS</h2>
                <p className="text-gray-400 text-xl max-w-2xl">
                    Passionate about creating intuitive and engaging user experiences.
                    Specialize in transforming ideas into beautifully crafted products.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {images.map((image) => (
                    <motion.div
                        key={image.id}
                        whileHover={{ x: 10 }}
                    >
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="bg-white rounded-lg p-3 w-16 h-16 flex items-center justify-center">
                                <img src={image.logo} alt="" className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white group-hover:text-gray-300 transition-colors">
                                    {image.title}
                                </h3>
                                <p className="text-zinc-500">{image.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mb-12">

                <h2 className="text-5xl font-bold text-white mb-8">OTHER TOOLS</h2>
                <p className="text-gray-400 text-xl max-w-2xl">
                    Passionate about creating intuitive and engaging user experiences.
                    Specialize in transforming ideas into beautifully crafted products.
                </p>
            </div>
            
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {tools.map((tool) => (
                    <motion.div
                        key={tool.id}
                        whileHover={{ x: 10 }}
                    >
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="bg-white rounded-lg p-3 w-16 h-16 flex items-center justify-center">
                                <img src={tool.logo} alt="" className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white group-hover:text-gray-300 transition-colors">
                                    {tool.title}
                                </h3>
                                <p className="text-zinc-500">{tool.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </>
    )
}

export default Tools