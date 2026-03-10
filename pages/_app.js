import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NotificationProvider } from '../components/Notifications'

function MyApp({ Component, pageProps }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      setIsAuthenticated(true)
    } else if (router.pathname !== '/login' && router.pathname !== '/setup') {
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