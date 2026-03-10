import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NotificationProvider } from '../components/Notifications'

function MyApp({ Component, pageProps }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')

    const isPortal = router.pathname === '/portal' || router.pathname.startsWith('/portal/')
    const isPublic = router.pathname === '/login' || router.pathname === '/setup' || isPortal

    if (token) {
      setIsAuthenticated(true)
    } else if (!isPublic) {
      router.push('/login')
    }
  }, [router.pathname])

  return (
    <NotificationProvider>
      <Component {...pageProps} />
    </NotificationProvider>
  )
}

export default MyApp