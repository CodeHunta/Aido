export default function Loading() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 16 }}>
      <div className="skel" style={{ height: 36, width: "40%" }} />
      <div className="skel" style={{ height: 18, width: "70%" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        <div className="skel" style={{ height: 120 }} />
        <div className="skel" style={{ height: 120 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
      <div className="skel" style={{ height: 220 }} />
    </main>
  );
}
