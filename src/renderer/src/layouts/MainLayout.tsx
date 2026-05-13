import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="h-screen w-screen bg-[#050816] text-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
