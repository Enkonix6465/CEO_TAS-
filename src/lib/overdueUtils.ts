// Utility functions for handling overdue task calculations across the application

export interface Task {
  id: string;
  status: string;
  due_date?: string;
  dueDate?: string;
  created_at?: any;
  progress_status?: string;
}

/**
 * Checks if a task is overdue based on consistent criteria
 * @param task - The task object to check
 * @returns boolean - true if the task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  // Don't consider completed or cancelled tasks as overdue
  if (!task || task.status === 'completed' || task.status === 'cancelled' || task.progress_status === 'completed') {
    return false;
  }

  // Get the due date from either field name (both are used across the app)
  const dueDate = task.due_date || task.dueDate;
  
  if (!dueDate) {
    return false;
  }

  let due: Date;
  
  try {
    if (typeof dueDate === 'string') {
      due = new Date(dueDate);
    } else if (dueDate.seconds) {
      // Firestore timestamp format
      due = new Date(dueDate.seconds * 1000);
    } else if (dueDate.toDate) {
      // Firestore timestamp with toDate method
      due = dueDate.toDate();
    } else {
      due = new Date(dueDate);
    }

    // Invalid date check
    if (isNaN(due.getTime())) {
      return false;
    }

    // Compare with current date (end of today)
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    return due < now;
  } catch (error) {
    console.warn('Error parsing due date:', dueDate, error);
    return false;
  }
};

/**
 * Gets overdue tasks from a list of tasks
 * @param tasks - Array of tasks to filter
 * @returns Array of overdue tasks
 */
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  if (!Array.isArray(tasks)) {
    return [];
  }
  
  return tasks.filter(isTaskOverdue);
};

/**
 * Gets overdue count from a list of tasks
 * @param tasks - Array of tasks to count
 * @returns Number of overdue tasks
 */
export const getOverdueCount = (tasks: Task[]): number => {
  return getOverdueTasks(tasks).length;
};

/**
 * Gets tasks that are due soon (within specified days)
 * @param tasks - Array of tasks to filter
 * @param daysAhead - Number of days to look ahead (default: 3)
 * @returns Array of tasks due soon
 */
export const getTasksDueSoon = (tasks: Task[], daysAhead: number = 3): Task[] => {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);
  futureDate.setHours(23, 59, 59, 999);

  return tasks.filter(task => {
    if (!task || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }

    const dueDate = task.due_date || task.dueDate;
    if (!dueDate) {
      return false;
    }

    try {
      let due: Date;
      
      if (typeof dueDate === 'string') {
        due = new Date(dueDate);
      } else if (dueDate.seconds) {
        due = new Date(dueDate.seconds * 1000);
      } else if (dueDate.toDate) {
        due = dueDate.toDate();
      } else {
        due = new Date(dueDate);
      }

      if (isNaN(due.getTime())) {
        return false;
      }

      return due >= now && due <= futureDate;
    } catch (error) {
      console.warn('Error parsing due date for due soon check:', dueDate, error);
      return false;
    }
  });
};

/**
 * Calculates overdue percentage from total tasks
 * @param tasks - Array of tasks
 * @returns Percentage of overdue tasks
 */
export const getOverduePercentage = (tasks: Task[]): number => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0;
  }

  const overdueCount = getOverdueCount(tasks);
  return Math.round((overdueCount / tasks.length) * 100);
};

/**
 * Gets overdue tasks grouped by priority
 * @param tasks - Array of tasks to group
 * @returns Object with overdue tasks grouped by priority
 */
export const getOverdueTasksByPriority = (tasks: Task[]): {
  high: Task[];
  medium: Task[];
  low: Task[];
  total: number;
} => {
  const overdueTasks = getOverdueTasks(tasks);
  
  return {
    high: overdueTasks.filter(task => (task as any).priority === 'high'),
    medium: overdueTasks.filter(task => (task as any).priority === 'medium'),
    low: overdueTasks.filter(task => (task as any).priority === 'low'),
    total: overdueTasks.length
  };
};
