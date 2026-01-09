export default async function handler(req, res) {
    const { code } = req.query;
    const client_id = process.env.VITE_CLICKUP_CLIENT_ID;
    const client_secret = process.env.CLICKUP_CLIENT_SECRET;

    if (!code || !client_id || !client_secret) {
        return res.status(400).json({ error: 'Missing code or credentials' });
    }

    try {
        const response = await fetch(`https://api.clickup.com/api/v2/oauth/token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`, {
            method: 'POST',
        });
        const data = await response.json();
        
        if (data.access_token) {
             res.status(200).json(data);
        } else {
             res.status(400).json(data);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to exchange token' });
    }
}
