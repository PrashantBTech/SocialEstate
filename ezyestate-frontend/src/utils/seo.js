export const SEO_DEFAULTS = {
  title: 'SocialEstate — Find Your Dream Property',
  description: 'SocialEstate connects property owners, builders and buyers across Tier 2 & 3 cities in India with full managed service.',
  keywords: 'real estate india, property for sale, buy plot, builder projects, tier 2 city property',
  ogImage: '/og-image.jpg',
  url: import.meta.env.VITE_APP_URL || 'https://SocialEstate.in',
}

export const buildSEO = ({ title, description, keywords, ogImage } = {}) => ({
  title: title ? `${title} | SocialEstate` : SEO_DEFAULTS.title,
  description: description || SEO_DEFAULTS.description,
  keywords: keywords || SEO_DEFAULTS.keywords,
  ogImage: ogImage || SEO_DEFAULTS.ogImage,
})
