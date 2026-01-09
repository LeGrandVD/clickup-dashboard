export default async function handler(req, res) {
    const { path, teamId, folderId } = req.query;
    const authHeader = req.headers['authorization'];
    const CLICKUP_TOKEN = authHeader || process.env.CLICKUP_TOKEN;

    if (!CLICKUP_TOKEN) {
        return res.status(500).json({ error: 'ClickUp Token not found' });
    }

    // Basic security: restrict to specific paths if needed
    // For now, we proxy requests to ClickUp API
    let url = '';
    if (path === 'sprint') {
        // Get latest sprint from folder
        url = `https://api.clickup.com/api/v2/folder/${folderId}/list?archived=false`;
    } else if (path === 'list') {
        const listId = req.query.listId;
        url = `https://api.clickup.com/api/v2/list/${listId}`;
    } else if (path === 'tasks') {
        const listId = req.query.listId;
        url = `https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true&subtasks=true`;
    } else if (path === 'folder_tasks') {
        const teamId = req.query.teamId;
        url = `https://api.clickup.com/api/v2/team/${teamId}/task?project_ids%5B%5D=${folderId}&include_closed=true&subtasks=true`;
    } else if (path === 'team_tasks') {
        const teamId = req.query.teamId;
        const listIdParam = req.query.listId;
        url = `https://api.clickup.com/api/v2/team/${teamId}/task?list_ids[]=${listIdParam}&include_closed=true&subtasks=true`;
    } else if (path === 'list_views') {
        const listId = req.query.listId;
        url = `https://api.clickup.com/api/v2/list/${listId}/view`;
    } else if (path === 'view_tasks') {
        const viewId = req.query.viewId;
        const page = req.query.page || 0;
        url = `https://api.clickup.com/api/v2/view/${viewId}/task?page=${page}&include_closed=true`;
    } else if (path === 'my_tasks') {
        const teamId = req.query.teamId;
        const userId = req.query.userId;
        const page = req.query.page || 0;
        url = `https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${userId}&page=${page}&include_closed=true&subtasks=true`;
    } else if (path === 'user') {
        url = `https://api.clickup.com/api/v2/user`;
    }

    if (!url) {
        return res.status(400).json({ error: 'Invalid path' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': CLICKUP_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from ClickUp' });
    }
}
