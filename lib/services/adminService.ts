import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase, db } from '@/lib/firebase/config';

const ensureFirebase = async (): Promise<boolean> => {
  try {
    await initializeFirebase();
    return !!db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

export const adminService = {
  // ===== Courses =====
  async getCourses() {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) {
        return [];
      }
      const snapshot = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')));
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        // Ensure document ID takes precedence over any id field in the data
        return { ...data, id: docSnap.id };
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      return []; // Return empty array on error
    }
  },

  async getCourse(courseId: string) {
    await ensureFirebase();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    return { id: courseSnap.id, ...courseSnap.data() };
  },

  async createCourse(courseData: Record<string, any>) {
    await ensureFirebase();
    
    // If an ID is provided, use setDoc to create with that specific ID
    // Otherwise, use addDoc to generate a random ID
    const { id, ...dataWithoutId } = courseData;
    
    if (id) {
      const courseRef = doc(db, 'courses', id);
      await setDoc(courseRef, {
        ...dataWithoutId,
        modules: dataWithoutId.modules ?? [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...dataWithoutId,
        modules: dataWithoutId.modules ?? [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    }
  },

  async updateCourse(courseId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'courses', courseId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteCourse(courseId: string) {
    const isInitialized = await ensureFirebase();
    if (!isInitialized || !db) {
      throw new Error('Firebase is not initialized');
    }
    
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    
    console.log('Deleting course from Firestore:', courseId);
    const courseRef = doc(db, 'courses', courseId);
    
    // Try to delete - Firebase will handle if document doesn't exist
    try {
      await deleteDoc(courseRef);
      console.log('Course deleted successfully from Firestore');
    } catch (error: any) {
      // If document doesn't exist, that's okay - it's already deleted
      if (error?.code === 'not-found' || error?.code === 'permission-denied') {
        console.warn(`Course ${courseId} may not exist or permission denied:`, error.message);
        // Still throw to let caller know, but with a clearer message
        throw new Error(`Unable to delete course: ${error.message || 'Course may not exist or you may not have permission'}`);
      }
      // Re-throw other errors
      throw error;
    }
  },

  // ===== Modules (used as Subjects) =====
  async getModule(moduleId: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) {
        return null;
      }
      const moduleRef = doc(db, 'modules', moduleId);
      const moduleSnap = await getDoc(moduleRef);
      if (!moduleSnap.exists()) return null;
      return { id: moduleSnap.id, ...moduleSnap.data() };
    } catch (error) {
      console.error('Error fetching module:', error);
      return null;
    }
  },

  async getModules(courseId?: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) {
        return [];
      }
      let qRef;
      if (courseId) {
        qRef = query(
          collection(db, 'modules'),
          where('courseId', '==', courseId)
        );
      } else {
        qRef = query(collection(db, 'modules'));
      }
      const snapshot = await getDocs(qRef);
      const modules = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      
      return modules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  async createModule(moduleData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'modules'), {
      ...moduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateModule(moduleId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'modules', moduleId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteModule(moduleId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'modules', moduleId));
  },

  // ===== Lessons =====
  async getLessons(moduleId?: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db) {
        return [];
      }
      let qRef;
      if (moduleId) {
        // Only filter by moduleId, sort in JavaScript to avoid index requirement
        qRef = query(
          collection(db, 'lessons'),
          where('moduleId', '==', moduleId)
        );
      } else {
        qRef = query(collection(db, 'lessons'));
      }
      const snapshot = await getDocs(qRef);
      const lessons = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Sort by order in JavaScript
      return lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return []; // Return empty array on error
    }
  },

  async createLesson(lessonData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'lessons'), {
      ...lessonData,
      completed: lessonData.completed ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateLesson(lessonId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'lessons', lessonId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteLesson(lessonId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'lessons', lessonId));
  },

  // ===== Quizzes =====
  async getQuiz(subjectId: string, moduleId: string) {
    try {
      const isInitialized = await ensureFirebase();
      if (!isInitialized || !db || !subjectId || !moduleId) {
        return null;
      }
      const quizRef = doc(db, 'quizzes', `${subjectId}_${moduleId}`);
      const quizSnap = await getDoc(quizRef);
      if (!quizSnap.exists()) return null;
      return { id: quizSnap.id, ...quizSnap.data() };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  },

  async saveQuiz(quizData: {
    courseId: string;
    courseTitle?: string;
    subjectId: string;
    subjectTitle?: string;
    moduleId: string;
    moduleName?: string;
    questions: any[];
  }) {
    await ensureFirebase();
    if (!db) return null;
    const quizRef = doc(db, 'quizzes', `${quizData.subjectId}_${quizData.moduleId}`);
    const existingSnap = await getDoc(quizRef);
    const payload: Record<string, any> = {
      ...quizData,
      questions: Array.isArray(quizData.questions) ? quizData.questions : [],
      updatedAt: serverTimestamp(),
    };
    if (existingSnap.exists()) {
      payload.createdAt = existingSnap.data()?.createdAt ?? serverTimestamp();
    } else {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(quizRef, payload, { merge: true });
    return quizRef.id;
  },

  async deleteQuiz(subjectId: string, moduleId: string) {
    await ensureFirebase();
    if (!db) return;
    const quizId = `${subjectId}_${moduleId}`;
    await deleteDoc(doc(db, 'quizzes', quizId));
  },

  // ===== Projects =====
  async getProjects() {
    await ensureFirebase();
    const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },

  async createProject(projectData: Record<string, any>) {
    await ensureFirebase();
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      isPublic: true,
      tags: projectData.tags ?? [],
      upvotes: projectData.upvotes ?? 0,
      comments: projectData.comments ?? 0,
      aiReview: projectData.aiReview ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProject(projectId: string, updates: Record<string, any>) {
    await ensureFirebase();
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProject(projectId: string) {
    await ensureFirebase();
    await deleteDoc(doc(db, 'projects', projectId));
  },

  // ===== Stats =====
  async getStats() {
    await ensureFirebase();
    const [coursesSnap, modulesSnap, projectsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'modules')),
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'users')),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalModules: modulesSnap.size,
      totalProjects: projectsSnap.size,
      totalCourses: coursesSnap.size,
    };
  },

  // ===== Users =====
  async getUsers() {
    await ensureFirebase();
    const snapshot = await getDocs(collection(db, 'users'));

    return snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as { id: string; createdAt?: any; [key: string]: any }))
      .sort((a, b) => {
        const aDate =
          typeof a.createdAt?.toDate === 'function'
            ? a.createdAt.toDate().getTime()
            : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const bDate =
          typeof b.createdAt?.toDate === 'function'
            ? b.createdAt.toDate().getTime()
            : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;
        return bDate - aDate;
      });
  },
};

export type AdminService = typeof adminService;

