import './DashboardCard.css';

export default function DashboardCard({ title, value, subtitle, icon, color }) {
  return (
    <div className={`dashboard-card dashboard-card--${color || 'blue'}`}>
      <div className="dashboard-card-body">
        <div className="dashboard-card-info">
          <p className="dashboard-card-title">{title}</p>
          <h3 className="dashboard-card-value">{value}</h3>
          {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
        </div>
        <div className="dashboard-card-icon-wrap">
          {icon}
        </div>
      </div>
    </div>
  );
}
