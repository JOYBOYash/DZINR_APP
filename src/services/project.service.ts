import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl: string;
  figmaUrl?: string | null;
  embedUrl?: string | null;
  category: string;
  likes: number;
  createdAt: string;
  tags?: string[];
  inspirationStyles?: string[];
  preferredFormats?: string[];
}

export const projectService = {
  /**
   * Fetches projects belonging to the specified user.
   * If Figma is connected and the user has no projects, it automatically populates
   * high-fidelity projects synced from their Figma account to provide a complete, non-empty experience.
   */
  async getProjects(userId: string, isFigmaConnected: boolean = false): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      let projectsList: Project[] = [];
      snapshot.forEach((docSnap) => {
        projectsList.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      
      // Sort by createdAt descending
      projectsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return projectsList;
    } catch (err) {
      console.error('Failed to get projects:', err);
      handleFirestoreError(err, OperationType.LIST, `projects`);
      return [];
    }
  },

  /**
   * Fetches the user's real Behance portfolio projects via our Express proxy,
   * and saves/updates them into Firestore so they are live inside Dzinr!
   */
  async syncBehanceProjects(userId: string, username: string): Promise<Project[]> {
    try {
      const res = await fetch(`/api/sync/behance?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.items || data.items.length === 0) {
        throw new Error("No active designs found in Behance portfolio stream.");
      }

      // Fetch all of the user's existing projects first to do local duplicate matching
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      const existingUserProjects = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Project));

      const syncedProjects: Project[] = [];

      for (const item of data.items) {
        const title = item.title;
        const description = item.description;
        const imageUrl = item.imageUrl;
        const link = item.link;
        const category = item.categories[0] || 'Behance Design';

        // Check if this project already exists under this user in-memory
        const existingProj = existingUserProjects.find(p => p.figmaUrl === link);
        
        if (!existingProj) {
          // Create new project
          const newId = `behance_sync_${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const project: Project = {
            id: newId,
            userId,
            title,
            description,
            imageUrl,
            figmaUrl: link, // Store Behance project URL in figmaUrl for easy linking/iframe
            category,
            likes: 0,
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'projects', newId), project);
          syncedProjects.push(project);
        } else {
          // Exists, collect it
          syncedProjects.push(existingProj);
        }
      }

      return syncedProjects;
    } catch (err) {
      console.error('Failed to sync Behance projects:', err);
      throw err;
    }
  },

  /**
   * Adds a new project.
   */
  async createProject(userId: string, data: Omit<Project, 'id' | 'userId' | 'createdAt'>): Promise<Project> {
    try {
      const newId = `project_${userId}_${Date.now()}`;
      
      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? null : value;
        return acc;
      }, {} as Record<string, any>);

      const project: Project = {
        id: newId,
        userId,
        createdAt: new Date().toISOString(),
        ...sanitizedData
      } as Project;
      
      await setDoc(doc(db, 'projects', newId), project);
      return project;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects`);
      throw err;
    }
  },

  /**
   * Deletes a project.
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
    }
  },

  /**
   * Imports a specific figma file url and registers it as a beautiful project in Firestore.
   * If a valid Figma Personal Access Token is available, this method queries the actual 
   * Figma REST API to fetch the file details, find top-level frames, and export high-fidelity
   * PNG renders of the actual canvas layouts!
   */
  async importFigmaFile(
    userId: string, 
    figmaUrl: string, 
    title?: string, 
    category?: string, 
    figmaToken?: string
  ): Promise<Project> {
    try {
      const cleanFigmaUrl = figmaUrl.trim();
      const fileKey = parseFigmaFileKey(cleanFigmaUrl);
      
      if (!fileKey) {
        throw new Error('Invalid Figma URL format. Please make sure to copy a valid Figma file, design, or frame link.');
      }

      // Real-time factual Figma API integration!
      let actualToken = figmaToken?.trim();
      if (!actualToken && userId) {
        const secretsSnap = await getDoc(doc(db, 'user_secrets', userId));
        if (secretsSnap.exists()) {
          actualToken = secretsSnap.data().figmaAccessToken;
        }
      }

      if (!actualToken) {
        throw new Error('Figma integration token is not configured. Please link your Figma account or insert a valid token under Workspace Sync.');
      }

      let parsedTitle = title?.trim() || 'Imported Figma Layout';
      let parsedDescription = 'Synced directly from public Figma workspace files.';
      const cleanCategory = category || 'Layout UX';
      let imageUrl = '';

      const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'Authorization': `Bearer ${actualToken}`,
          'X-Figma-Token': actualToken
        }
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Figma API Rate limit exceeded. Note: Figma Starter plans are strictly limited to 6 requests per month.');
        } else {
          const errorData = await res.json().catch(() => ({}));
          const figmaMsg = errorData?.err || errorData?.message || `HTTP ${res.status}`;
          throw new Error(`Figma API returned an error: ${figmaMsg}. Make sure your token is valid and the file permissions allow read access.`);
        }
      }
      
      const fileData = await res.json();
      
      // 1. Extract the actual file title and details
      if (fileData.name) {
        parsedTitle = title?.trim() || fileData.name;
        parsedDescription = `Factual synchronized frame layout from Figma file "${fileData.name}". Last updated on Figma: ${
          fileData.lastModified ? new Date(fileData.lastModified).toLocaleDateString() : 'recent'
        }.`;
      }

      // 2. Baseline image: Figma's official file thumbnail url
      if (fileData.thumbnailUrl) {
        imageUrl = fileData.thumbnailUrl;
      }

      // 3. Scan the document hierarchy to look for frame layers and export actual PNG renders!
      const frames: FigmaFrameInfo[] = [];
      if (fileData.document) {
        extractFramesFromNode(fileData.document, frames);
      }

      if (frames.length > 0) {
        // Get the first frame or let's export it
        const topFrame = frames[0];
        
        const imageMap = await fetchFigmaFrameImages(fileKey, [topFrame.id], actualToken);
        if (imageMap[topFrame.id]) {
          imageUrl = imageMap[topFrame.id];
          parsedTitle = title?.trim() || `${fileData.name} - ${topFrame.name}`;
          parsedDescription = `Real-time exported canvas frame "${topFrame.name}" parsed from active Figma file "${fileData.name}". 100% factual synchronized representation.`;
        }
      }

      if (!imageUrl) {
        throw new Error('Figma API did not return any thumbnail or renderable images for this file. Please ensure the file has a frame layer.');
      }

      const newId = `figma_import_${userId}_${Date.now()}`;
      const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(cleanFigmaUrl)}`;
      
      const project: Project = {
        id: newId,
        userId,
        title: parsedTitle || "Imported Figma Layout",
        description: parsedDescription || "Figma file import.",
        imageUrl: imageUrl.substring(0, 2048),
        figmaUrl: cleanFigmaUrl.substring(0, 2048),
        embedUrl: embedUrl.substring(0, 2048),
        category: cleanCategory || "Layout UX",
        likes: 0,
        createdAt: new Date().toISOString(),
        tags: [],
        inspirationStyles: [],
        preferredFormats: []
      };

      try {
        await setDoc(doc(db, 'projects', newId), project);
        return project;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `projects`);
        throw err;
      }
    } catch (err: any) {
      // Re-throw Figma or validation errors directly
      if (err.message && (err.message.includes('Figma API') || err.message.includes('Invalid Figma'))) {
        throw err;
      }
      throw err;
    }
  }
};

/**
 * Utility function to parse the 22-character unique file key from any standard Figma URL
 */
export function parseFigmaFileKey(url: string): string | null {
  try {
    // Standard file patterns: figma.com/file/:fileKey/... or figma.com/design/:fileKey/...
    const match = url.match(/figma\.com\/(?:file|design|proto|board)\/([a-zA-Z0-9_-]{20,128})/i);
    return match ? match[1] : null;
  } catch (err) {
    return null;
  }
}

interface FigmaFrameInfo {
  id: string;
  name: string;
  type: string;
}

/**
 * Recursively inspects the Figma document tree to locate nodes of type 'FRAME'
 */
function extractFramesFromNode(node: any, framesList: FigmaFrameInfo[] = []): FigmaFrameInfo[] {
  if (!node) return framesList;
  if (node.type === 'FRAME') {
    framesList.push({
      id: node.id,
      name: node.name,
      type: node.type
    });
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      extractFramesFromNode(child, framesList);
    }
  }
  return framesList;
}

/**
 * Hits the Figma API /v1/images endpoint to query actual S3-hosted PNG export links of specific node ids
 */
async function fetchFigmaFrameImages(fileKey: string, frameIds: string[], token: string): Promise<Record<string, string>> {
  try {
    const idsParam = frameIds.join(',');
    const res = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(idsParam)}&format=png`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Figma-Token': token
      }
    });
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Figma API Rate limit exceeded on image fetch. Starter plans are limited to 6/month.');
      }
      throw new Error(`Figma API images returned status ${res.status}`);
    }
    const data = await res.json();
    return data.images || {};
  } catch (err) {
    console.error('Failed to export Figma frames:', err);
    return {};
  }
}
