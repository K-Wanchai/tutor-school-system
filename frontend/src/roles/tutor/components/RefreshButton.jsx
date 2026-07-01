import './RefreshButton.css';

export default function RefreshButton({
  onClick,
  loading = false,
}) {
  return (
    <button
      type="button"
      className="refresh-button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
    </button>
  );
}