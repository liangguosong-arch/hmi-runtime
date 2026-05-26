// server.js - Unified Express Server for HMI Runtime
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Load device configuration at startup
let deviceConfig = null;
async function loadDeviceConfig() {
  try {
    const configPath = join(__dirname, 'device-config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    deviceConfig = JSON.parse(content);
    console.log('[Config] Device configuration loaded successfully');
  } catch (error) {
    console.error('[Config] Failed to load device configuration:', error.message);
    // Set default configuration if file not found or invalid
    deviceConfig = {
      brand: 'other',
      model: 'Unknown',
      screenResolution: {
        width: 1024,
        height: 768
      },
      serialNumber: 'N/A',
      firmwareVersion: 'N/A'
    };
  }
}

// Middleware configuration
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
if (isDev) {
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path}`);
    next();
  });
}

// Serve static files from public directory (for both dev and prod)
app.use(express.static(join(__dirname, 'public')));

// In production, serve built files from dist directory
if (!isDev) {
  const distPath = join(__dirname, 'dist');
  console.log(`[Server] Production mode: Serving static files from ${distPath}`);
  app.use(express.static(distPath));
}

let viteServer;

// Initialize Vite middleware in development mode
async function setupDevMiddleware() {
  if (isDev) {
    // Dynamically import Vite only in development mode
    const { createServer: createViteServer } = await import('vite');
    
    viteServer = await createViteServer({
      root: __dirname,
      server: {
        middlewareMode: 'html'  // Use 'html' mode for SPA
      }
    });
    
    // Use Vite's transform middleware
    app.use(viteServer.middlewares);
    console.log('[Server] Development mode: Vite middleware enabled');
  }
}

// API Routes

// Update project endpoint
app.post('/api/projects/update', async (req, res) => {
  try {
    const { project, projectName } = req.body;
    
    if (!project) {
      return res.status(400).json({
        code: 400,
        message: 'Project data is required'
      });
    }

    // Determine save path
    const savePath = projectName ? join(__dirname, 'public', 'projects', projectName) : join(__dirname, 'public', 'projects', 'default.hmi');
    
    // Ensure directory exists
    const dir = dirname(savePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save project file
    await fs.writeFile(savePath, JSON.stringify(project, null, 2));
    
    console.log(`[API] Project saved to: ${savePath}`);
    
    res.json({
      code: 200,
      message: 'Project updated successfully',
      data: { path: savePath }
    });
  } catch (error) {
    console.error('[API] Error saving project:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to save project',
      error: error.message
    });
  }
});

// Get project list
app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = join(__dirname, 'public', 'projects');
    
    // Check if directory exists
    try {
      await fs.access(projectsDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(projectsDir, { recursive: true });
      return res.json({
        code: 200,
        data: []
      });
    }
    
    const files = await fs.readdir(projectsDir);
    const hmiFiles = files.filter(file => file.endsWith('.hmi'));
    
    const projects = await Promise.all(
      hmiFiles.map(async (file) => {
        try {
          const content = await fs.readFile(join(projectsDir, file), 'utf-8');
          const project = JSON.parse(content);
          return {
            id: project.id,
            name: project.name,
            version: project.version,
            fileName: file,
            path: join('public', 'projects', file)
          };
        } catch (error) {
          console.error(`Error reading project file ${file}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed reads
    const validProjects = projects.filter(p => p !== null);
    
    res.json({
      code: 200,
      data: validProjects
    });
  } catch (error) {
    console.error('[API] Error listing projects:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to list projects',
      error: error.message
    });
  }
});

// Get single project by path
app.get('/api/projects/:projectName', async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const projectPath = join(__dirname, 'public', 'projects', projectName);
    
    // Security check - prevent directory traversal
    if (!projectPath.startsWith(join(__dirname, 'public', 'projects'))) {
      return res.status(403).json({
        code: 403,
        message: 'Invalid project path'
      });
    }
    
    const content = await fs.readFile(projectPath, 'utf-8');
    const project = JSON.parse(content);
    
    res.json({
      code: 200,
      data: project
    });
  } catch (error) {
    console.error('[API] Error reading project:', error);
    res.status(404).json({
      code: 404,
      message: 'Project not found',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    timestamp: Date.now(),
    environment: isDev ? 'development' : 'production'
  });
});

// Get device instance information
app.get('/api/deviceInstance', (req, res) => {
  if (!deviceConfig) {
    return res.status(500).json({
      code: 500,
      message: 'Device configuration not loaded'
    });
  }

  res.json({
    code: 200,
    data: deviceConfig
  });
});

// Get project metadata for update detection
app.get('/api/project/meta', async (req, res) => {
  try {
    const projectName = req.query.projectName || 'default.hmi';
    
    if (!projectName) {
      return res.status(400).json({
        code: 400,
        message: 'Project name is required'
      });
    }

    const projectPath = join(__dirname, 'public', 'projects', projectName);
    
    // Security check - prevent directory traversal
    if (!projectPath.startsWith(join(__dirname, 'public', 'projects'))) {
      return res.status(403).json({
        code: 403,
        message: 'Invalid project path'
      });
    }

    // Get file stats
    const stats = await fs.stat(projectPath);
    
    // Read only version and updatedAt fields
    const content = await fs.readFile(projectPath, 'utf-8');
    const project = JSON.parse(content);

    res.json({
      code: 200,
      data: {
        id: project.id,
        name: project.name,
        version: project.version,
        updatedAt: project.updatedAt || stats.mtimeMs,
        lastModified: stats.mtimeMs
      }
    });
  } catch (error) {
    console.error('[API] Error reading project metadata:', error);
    res.status(404).json({
      code: 404,
      message: 'Project not found',
      error: error.message
    });
  }
});

// SPA fallback - serve index.html for all non-API, non-static routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      code: 404,
      message: 'API endpoint not found'
    });
  }
  
  // Skip static file requests (files with extensions)
  if (req.path.includes('.')) {
    // Let Express static middleware handle it or return 404
    return next();
  }
  
  // In development, let Vite middleware handle the request
  // In production, serve the built index.html
  if (!isDev) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  } else {
    // Let Vite's middleware handle it by calling next()
    next();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    code: 500,
    message: 'Internal server error',
    error: isDev ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    // Load device configuration first
    await loadDeviceConfig();
    
    await setupDevMiddleware();
    
    const server = createServer(app);
    
    server.listen(PORT, () => {
      console.log(`\n🚀 HMI Runtime Server Started`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  Environment: ${isDev ? 'Development' : 'Production'}`);
      console.log(`  Frontend:    http://localhost:${PORT}`);
      console.log(`  API Base:    http://localhost:${PORT}/api`);
      console.log(`  Projects:    http://localhost:${PORT}/api/projects`);
      console.log(`  Device Info: http://localhost:${PORT}/api/deviceInstance`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        if (viteServer) {
          viteServer.close();
        }
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\n[Server] SIGINT received. Shutting down gracefully...');
      server.close(() => {
        if (viteServer) {
          viteServer.close();
        }
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
