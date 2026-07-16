import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/notes', label: 'Notes', icon: '📝' },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs font-medium ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
