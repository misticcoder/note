export default function ConfirmDialog({
                                          open,
                                          title,
                                          message,
                                          onConfirm,
                                          onCancel,
                                      }) {
    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{title}</h3>
                <p>{message}</p>

                <div className="modal-actions">
                    <button className="button" onClick={onConfirm}>
                                <span className="button_lg">
                                    <span className="button_sl"></span>
                                    <span className="button_text"> Confirm </span>

                                </span>
                    </button>

                    <button className="button" onClick={onCancel}>
                                <span className="button_lg" style={{opacity: "50%"}}>

                                    <span className="button_text"> Cancel </span>
                                </span>

                    </button>
                </div>
            </div>
        </div>
    );
}
