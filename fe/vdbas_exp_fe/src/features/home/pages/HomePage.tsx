import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/contexts/AuthContext'

/**
 * HomePage — default landing page for authenticated users.
 *
 * Replace or extend this component to build your feature's home screen.
 */
const HomePage = () => {
  const { t: translate } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {translate('app.welcome')}, {user?.preferred_username || user?.name || 'User'} 👋
        </h1>
        <p className="text-gray-500">
          {translate('app.title')}
        </p>
      </div>
    </div>
  )
}

export default HomePage
