// @ts-check
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/clickup-dashboard/',
    plugins: [
      react(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            
            if (url.pathname === '/api/oauth') {
                const code = url.searchParams.get('code');
                if (!code) {
                   res.statusCode = 400;
                   res.end(JSON.stringify({ error: 'No code provided' }));
                   return;
                }
                const client_id = env.VITE_CLICKUP_CLIENT_ID;
                const client_secret = env.CLICKUP_CLIENT_SECRET;

                try {
                    const response = await fetch(`https://api.clickup.com/api/v2/oauth/token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`, {
                        method: 'POST',
                    });
                    const data = await response.json();
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                } catch (e) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Token exchange failed' }));
                }
                return;
            }

            if (url.pathname.includes('/api/proxy') || url.pathname.includes('/proxy.php')) {
              const urlParams = url.searchParams
              const path = urlParams.get('path')
              const folderId = urlParams.get('folderId')
              const listId = urlParams.get('listId')
              
              // Prefer Authorization header, fallback to env token
              const authHeader = req.headers['authorization'];
              const token = authHeader || env.CLICKUP_TOKEN

              if (!token) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'No Authorization token found' }))
                return
              }

              let apiUrl = ''
              if (path === 'sprint') {
                apiUrl = `https://api.clickup.com/api/v2/folder/${folderId}/list?archived=false`
              } else if (path === 'list') {
                apiUrl = `https://api.clickup.com/api/v2/list/${listId}`
              } else if (path === 'tasks') {
                apiUrl = `https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true&subtasks=true`
              } else if (path === 'folder_tasks') {
                const teamId = env.VITE_CLICKUP_TEAM_ID
                apiUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?project_ids[]=${folderId}&include_closed=true&subtasks=true`
              } else if (path === 'team_tasks') {
                const teamId = env.VITE_CLICKUP_TEAM_ID
                apiUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?list_ids[]=${listId}&include_closed=true&subtasks=true`
              } else if (path === 'list_views') {
                apiUrl = `https://api.clickup.com/api/v2/list/${listId}/view`
              } else if (path === 'view_tasks') {
                const viewId = urlParams.get('viewId')
                const page = urlParams.get('page') || 0
                apiUrl = `https://api.clickup.com/api/v2/view/${viewId}/task?page=${page}&include_closed=true`
              } else if (path === 'my_tasks') {
                const teamId = env.VITE_CLICKUP_TEAM_ID
                const userId = urlParams.get('userId')
                const page = urlParams.get('page') || 0
                apiUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${userId}&page=${page}&include_closed=true&subtasks=true`
              } else if (path === 'user') {
                apiUrl = `https://api.clickup.com/api/v2/user`
              }

              if (apiUrl) {
                try {
                  const response = await fetch(apiUrl, {
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' }
                  })
                  const data = await response.json()
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                } catch (e) {
                  res.statusCode = 500
                  res.end(JSON.stringify({ error: e.message }))
                }
                return
              }
            }
            next()
          })
        }
      }
    ]
  }
})
