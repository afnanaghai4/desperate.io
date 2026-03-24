import { getHealth } from "../lib/api";

export default async function HomePage() {
  let healthData : {status: string, timestamp: string} | null = null;
  let error = "";

  try {
    healthData = await getHealth();
  }catch (err) {
    error = "Failed to fetch health data.";
    console.error(err);
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>AI Career Platform</h1>
      <p>Frontend is running.</p>

      <h2>Backend Status</h2>

      {healthData ? (
        <div>
          <p>Status: {healthData.status}</p>
          <p>Timestamp: {healthData.timestamp}</p>
        </div>
      ) : (
        <p>{error}</p>
      )}
    </main>
  );
}