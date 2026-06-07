import { Helmet } from 'react-helmet-async'

export default function StaticPage({ title }) {
  return (
    <>
      <Helmet><title>{title} | SocialEstate</title></Helmet>
      <div className="page-container pt-24 pb-16 min-h-[60vh]">
        <h1 className="text-4xl font-display font-bold text-primary-900 mb-6">{title}</h1>
        <div className="prose max-w-none text-gray-600">
          <p>
            Welcome to the {title} page. This section is currently under development.
            Please check back later for more information and updates.
          </p>
        </div>
      </div>
    </>
  )
}
