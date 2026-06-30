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
  sourceUrl?: string;
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
   */
  async getProjects(userId: string): Promise<Project[]> {
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
        const existingProj = existingUserProjects.find(p => p.sourceUrl === link);
        
        if (!existingProj) {
          // Create new project
          const newId = `behance_sync_${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const project: Project = {
            id: newId,
            userId,
            title,
            description,
            imageUrl,
            sourceUrl: link, // Store Behance project URL
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
  }
};
