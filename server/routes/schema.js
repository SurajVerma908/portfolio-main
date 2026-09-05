// Collection definitions shared by the API and the admin UI
export const collections = {
  profile: {
    label: 'Profile',
    singular: 'Profile',
    icon: '👤',
    fields: ['name', 'title', 'tagline', 'about', 'email', 'phone', 'location', 'avatar', 'resume', 'github', 'linkedin', 'twitter', 'website'],
    textareas: ['about'],
    slugs: false,
    singleton: true,
    validate: (body) => (body.name && String(body.name).trim() ? null : 'Name is required'),
  },
  skills: {
    label: 'Skills',
    singular: 'Skill',
    icon: '⚡',
    fields: ['name', 'category', 'level', 'icon'],
    slugs: false,
    validate: (body) => (body.name && String(body.name).trim() ? null : 'Name is required'),
  },
  projects: {
    label: 'Projects',
    singular: 'Project',
    icon: '🚀',
    fields: ['title', 'summary', 'description', 'tags', 'image', 'link', 'repo', 'featured'],
    textareas: ['summary', 'description'],
    slugs: true,
    slugFrom: 'title',
    validate: (body) => (body.title && String(body.title).trim() ? null : 'Title is required'),
  },
  experience: {
    label: 'Experience',
    singular: 'Experience entry',
    icon: '💼',
    fields: ['role', 'company', 'period', 'description', 'location', 'current'],
    textareas: ['description'],
    slugs: false,
    validate: (body) => (body.role && String(body.role).trim() ? null : 'Role is required'),
  },
  education: {
    label: 'Education',
    singular: 'Education entry',
    icon: '🎓',
    fields: ['degree', 'school', 'period', 'description', 'location'],
    textareas: ['description'],
    slugs: false,
    validate: (body) => (body.degree && String(body.degree).trim() ? null : 'Degree is required'),
  },
  services: {
    label: 'Services',
    singular: 'Service',
    icon: '🧰',
    fields: ['title', 'description', 'icon', 'price'],
    textareas: ['description'],
    slugs: false,
    validate: (body) => (body.title && String(body.title).trim() ? null : 'Title is required'),
  },
  testimonials: {
    label: 'Testimonials',
    singular: 'Testimonial',
    icon: '💬',
    fields: ['name', 'role', 'company', 'quote', 'avatar', 'rating'],
    textareas: ['quote'],
    slugs: false,
    validate: (body) => (body.name && String(body.name).trim() ? null : 'Name is required'),
  },
  posts: {
    label: 'Blog posts',
    singular: 'Blog post',
    icon: '📝',
    fields: ['title', 'excerpt', 'content', 'cover', 'tags', 'readTime'],
    textareas: ['excerpt', 'content'],
    slugs: true,
    slugFrom: 'title',
    validate: (body) => (body.title && String(body.title).trim() ? null : 'Title is required'),
  },
  messages: {
    label: 'Messages',
    singular: 'Message',
    icon: '✉️',
    fields: ['name', 'email', 'subject', 'message', 'read', 'replied'],
    textareas: ['message'],
    slugs: false,
    adminOnly: true,
    validate: (body) => (body.name && body.email && body.message ? null : 'Name, email and message are required'),
  },
  settings: {
    label: 'Site settings',
    singular: 'Setting',
    icon: '⚙️',
    fields: ['siteTitle', 'seoDescription', 'accent', 'footerNote', 'heroKicker', 'heroHeadline', 'heroSubline', 'socialGithub', 'socialLinkedin', 'socialTwitter', 'socialDribbble', 'seoKeywords', 'analyticsId', 'maintenance'],
    textareas: ['seoDescription', 'footerNote'],
    slugs: false,
    singleton: true,
    validate: () => null,
  },
}

export const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/[\s_]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

export const orderFields = (fields) => fields

export const collectionNames = Object.keys(collections)
