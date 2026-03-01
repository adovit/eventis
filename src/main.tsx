import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Register from './pages/Register'
import Login from './pages/Login'
import ListTicket from './pages/ListTicket'
import MyListings from './pages/MyListings'
import OrderSuccess from './pages/OrderSuccess'
import MyOrders from './pages/MyOrders'
import MyEarnings from './pages/MyEarnings'
import AdminPayouts from './pages/AdminPayouts'
import AdminListings from './pages/AdminListings'
import AdminUsers from './pages/AdminUsers'
import Verify from './pages/Verify'
import Profile from './pages/Profile'
import NewsIndex from './pages/NewsIndex'
import NewsDetail from './pages/NewsDetail'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/',               element: <EventList /> },
      { path: '/events/:slug',   element: <EventDetail /> },
      { path: '/login',          element: <Login /> },
      { path: '/register',       element: <Register /> },
      { path: '/order-success',  element: <OrderSuccess /> },
      { path: '/naujienos',      element: <NewsIndex /> },
      { path: '/naujienos/:slug', element: <NewsDetail /> },
      // Protected routes (seller + buyer)
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/sell',           element: <ListTicket /> },
          { path: '/my-listings',    element: <MyListings /> },
          { path: '/my-orders',      element: <MyOrders /> },
          { path: '/my-earnings',    element: <MyEarnings /> },
          { path: '/admin/payouts',  element: <AdminPayouts /> },
          { path: '/admin/listings', element: <AdminListings /> },
          { path: '/admin/users',    element: <AdminUsers /> },
          { path: '/verify',         element: <Verify /> },
          { path: '/profile',        element: <Profile /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
