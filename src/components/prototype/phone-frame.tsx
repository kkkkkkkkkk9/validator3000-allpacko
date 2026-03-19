export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-frame">
      <div className="phone-btn phone-btn-action" />
      <div className="phone-btn phone-btn-volup" />
      <div className="phone-btn phone-btn-voldown" />
      <div className="phone-btn phone-btn-power" />
      <div className="phone">{children}</div>
    </div>
  );
}
