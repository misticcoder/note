import "../styles/profile.css";

export default function DashboardSection({
                                              title,
                                              actionLabel,
                                              onAction,
                                              children,
                                          }) {
    return (
        <section className="dashboard-section">
            {(title || actionLabel) && (
                <div className="dashboard-section-header">
                    {title && <h3>{title}</h3>}

                    {actionLabel && onAction && (
                        <button
                            className="dashboard-section-action"
                            onClick={onAction}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}

            <div className="dashboard-section-body">
                {children}
            </div>
        </section>
    );
}
