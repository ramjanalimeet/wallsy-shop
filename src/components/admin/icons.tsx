// Line icons for the dashboard (24×24, 1.6px stroke).
type P = { className?: string };
const icon = (path: React.ReactNode) =>
  function Icon({ className = "h-5 w-5" }: P) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {path}
      </svg>
    );
  };

export const HomeIcon = icon(<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" />);
export const OrdersIcon = icon(<><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>);
export const ProductsIcon = icon(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>);
export const CollectionsIcon = icon(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 4v16" /></>);
export const DiscountIcon = icon(<><path d="M18 6 6 18" /><circle cx="7.5" cy="7.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></>);
export const StarIcon = icon(<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />);
export const CustomersIcon = icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>);
export const SettingsIcon = icon(<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></>);
export const ExternalIcon = icon(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>);
export const LogoutIcon = icon(<><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" /><path d="m15 8 4 4-4 4M19 12H9" /></>);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const MoreIcon = icon(<><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>);
export const MenuIcon = icon(<path d="M4 7h16M4 12h16M4 17h16" />);
export const FinanceIcon = icon(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V6" /></>);
