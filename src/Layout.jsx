import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

function Layout() {
  return (
    <>
      <h1>GitSearch</h1>
      <Navigation />
      <Outlet />
    </>
  );
}

function Navigation() {
  function getClassName({isActive}){
    return isActive ? 'navlink navlink-active' : 'navlink'
  }
  return (
    <nav>
      <NavLink className={getClassName} to='/search'>Search</NavLink>
      <NavLink className={getClassName} to='/history'>History</NavLink>
    </nav>
  );
}

export default Layout;