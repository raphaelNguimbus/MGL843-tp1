

const API_URL = 'http://localhost:3000/api';

async function testExpiration() {
    console.log('🧪 Starting Expiration Test...');

    // 1. Create a note that expires in 5 seconds
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 5 * 1000); // 5 seconds from now

    console.log(`📝 Creating note expiring at ${expirationDate.toISOString()}...`);

    const createRes = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: 'This note should delete itself',
            tags: ['test-expiration'],
            expirationDate: expirationDate.toISOString()
        })
    });

    if (!createRes.ok) {
        console.error('❌ Failed to create note:', await createRes.text());
        return;
    }

    const note = await createRes.json();
    console.log(`✅ Note created with ID: ${note.id}`);

    // 2. Verify it exists
    const checkRes = await fetch(`${API_URL}/notes`);
    const notes = await checkRes.json();
    const exists = notes.find(n => n.id === note.id);

    if (!exists) {
        console.error('❌ Note not found immediately after creation!');
        return;
    }
    console.log('✅ Note confirmed to exist.');

    // 3. Wait for expiration + cleanup cycle
    // Server checks every 60s. We need to wait > 60s to be sure.
    // Let's wait 70 seconds.
    console.log('⏳ Waiting 70 seconds for expiration and cleanup...');

    await new Promise(resolve => setTimeout(resolve, 70000));

    // 4. Verify it's gone
    const checkRes2 = await fetch(`${API_URL}/notes`);
    const notes2 = await checkRes2.json();
    const exists2 = notes2.find(n => n.id === note.id);

    if (exists2) {
        console.error('❌ Note still exists! Auto-deletion failed.');
        console.log('Debug - Current time:', new Date().toISOString());
        console.log('Debug - Note expiration:', note.expirationDate);
    } else {
        console.log('✅ Note successfully deleted!');
    }
}

testExpiration().catch(console.error);
