export default function SectionHeader({ title, action }) {
    return (
        <div className="section-header">
            <h2>{title}</h2>
            {action && <button className="btn-primary">{action}</button>}
        </div>
    );
}
