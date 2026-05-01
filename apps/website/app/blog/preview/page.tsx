import { Suspense } from 'react'
import Footer from '../../components/Footer'
import Navigation from '../../components/Navigation'
import StudioBlogPreview from '../../components/StudioBlogPreview'

export default function BlogPreviewPage() {
  return (
    <>
      <Navigation />
      <main>
        <Suspense fallback={null}>
          <StudioBlogPreview />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
