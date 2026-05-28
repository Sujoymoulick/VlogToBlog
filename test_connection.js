async function check() {
  try {
    console.log("Checking backend health at http://localhost:5000/health...");
    const res = await fetch('http://localhost:5000/health');
    console.log(`Connection successful! Status code: ${res.status}`);
    const data = await res.json();
    console.log("Health Check Response Data:", data);
  } catch (e) {
    console.log(`Failed to connect to backend: ${e.message}`);
  }
}
check();
