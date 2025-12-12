// pages/_app.js
import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

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

  return <Component {...pageProps} />
}

export default MyApp