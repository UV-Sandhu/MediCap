import './PageHeader.css';

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mc-page-header">
      <div className="mc-page-header-text">
        <h1 className="mc-page-header-title">{title}</h1>
        {subtitle && <p className="mc-page-header-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="mc-page-header-right">{right}</div>}
    </div>
  );
}
