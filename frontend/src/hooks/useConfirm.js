import { useState } from "react";

export function useConfirm() {
    const [state, setState] = useState({
        open: false,
        payload: null,
        onConfirm: null,
    });

    const confirm = (payload, onConfirm) => {
        setState({
            open: true,
            payload,
            onConfirm,
        });
    };

    const handleConfirm = async () => {
        if (state.onConfirm) {
            await state.onConfirm(state.payload);
        }
        setState({ open: false, payload: null, onConfirm: null });
    };

    const handleCancel = () => {
        setState({ open: false, payload: null, onConfirm: null });
    };

    return {
        confirmState: state,
        confirm,
        handleConfirm,
        handleCancel,
    };
}
