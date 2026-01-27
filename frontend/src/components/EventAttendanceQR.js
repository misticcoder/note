import { QRCodeCanvas } from "qrcode.react";

export default function EventAttendanceQR({ eventId, attendanceCode }) {
    if (!attendanceCode) return null;

    const url = `${window.location.origin}/#/events/${eventId}/check-in?code=${attendanceCode}`;

    return (
        <div className="attendance-qr">
            <h3>Attendance QR</h3>
            <QRCodeCanvas value={url} size={220} />
            <div className="muted" style={{ marginTop: "6px" }}>
                Scan to check in
            </div>
        </div>
    );
}
