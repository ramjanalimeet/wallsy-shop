// Renders the dashboard at 80% so it looks right at the browser's default 100% zoom.
// Only mounted on admin pages, so the storefront keeps its normal size.
export function AdminScale() {
  return <style>{`html{zoom:0.8}`}</style>;
}
