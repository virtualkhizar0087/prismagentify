import Link from 'next/link'
import { Phone } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <Phone className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl font-medium text-gray-700 mb-1">Page not found</p>
      <p className="text-gray-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
