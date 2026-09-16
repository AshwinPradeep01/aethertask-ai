import { useTaskStore } from '../store/useTaskStore';
import { Task, Subtask, Priority, MatrixQuadrant, AgentToolExecution } from '../types';

interface AgentResponse {
  message: string;
  toolCalls: AgentToolExecution[];
}

export class AIService {
  /**
   * Main entrypoint for processing user messages in the Agent Drawer or Command Palette
   */
  static async processUserMessage(userInput: string): Promise<AgentResponse> {
    const store = useTaskStore.getState();
    const { aiConfig, tasks } = store;

    // If Gemini API is configured with key
    if (aiConfig.provider === 'gemini' && aiConfig.geminiApiKey) {
      try {
        return await this.callGeminiAgent(userInput, aiConfig.geminiApiKey, tasks);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local agent heuristics:', err);
      }
    }

    // If OpenAI API is configured with key
    if (aiConfig.provider === 'openai' && aiConfig.openaiApiKey) {
      try {
        return await this.callOpenAIAgent(userInput, aiConfig.openaiApiKey, aiConfig.openaiBaseUrl, tasks);
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local agent heuristics:', err);
      }
    }

    // Default: Smart Autonomous Offline Heuristic Agent
    return this.processOfflineHeuristics(userInput, tasks);
  }

  /**
   * Autonomous offline intelligence engine
   */
  private static async processOfflineHeuristics(input: string, currentTasks: Task[]): Promise<AgentResponse> {
    // Artificial small delay for realistic agent thinking experience
    await new Promise((r) => setTimeout(r, 650));

    const lower = input.toLowerCase().trim();
    const toolCalls: AgentToolExecution[] = [];
    const store = useTaskStore.getState();

    // 1. Intent: Reschedule Overdue Tasks
    if (lower.includes('reschedule') || (lower.includes('overdue') && (lower.includes('move') || lower.includes('postpone') || lower.includes('fix')))) {
      const today = new Date().toISOString().split('T')[0];
      const count = store.rescheduleOverdueTasks(today);
      toolCalls.push({
        toolName: 'reschedule_overdue_tasks',
        description: 'Auto-reschedule all overdue incomplete tasks to today',
        status: 'success',
        resultSummary: `Rescheduled ${count} overdue task(s) to today (${today})`,
      });

      return {
        message: count > 0 
          ? `I've analyzed your schedule and moved **${count} overdue task(s)** to today so you can triage them with a fresh start.`
          : `Great news! You don't have any overdue tasks right now. Your schedule is completely up-to-date.`,
        toolCalls,
      };
    }

    // 2. Intent: Goal Decomposition / Breakdown ("break down", "decompose", "plan for", "steps to")
    if (lower.startsWith('break down') || lower.startsWith('decompose') || lower.includes('subtasks for') || lower.includes('plan for')) {
      const goal = input.replace(/^(break down|decompose|generate subtasks for|plan for|create plan for)\s*/i, '').trim();
      const decomposed = this.generateSubtasksForGoal(goal || 'Project Execution');

      const newTask = store.addTask({
        title: goal ? `Plan: ${goal.charAt(0).toUpperCase() + goal.slice(1)}` : 'Comprehensive Project Plan',
        description: `Autonomous agent breakdown for goal: "${goal}"`,
        priority: 'high',
        quadrant: 'do_first',
        dueDate: new Date().toISOString().split('T')[0],
        tags: ['AI-Plan', 'Project'],
        subtasks: decomposed.subtasks,
        estimatedMinutes: decomposed.totalMinutes,
        aiGenerated: true,
      });

      toolCalls.push({
        toolName: 'breakdown_goal',
        description: `Decomposed goal into ${decomposed.subtasks.length} actionable subtasks`,
        status: 'success',
        resultSummary: `Created parent task with ${decomposed.subtasks.length} subtasks (~${decomposed.totalMinutes} mins total)`,
        affectedTaskIds: [newTask.id],
      });

      return {
        message: `I've broken down **"${goal}"** into **${decomposed.subtasks.length} concrete actionable milestones** with time estimates. I added it directly to your task board with High priority:

${decomposed.subtasks.map((st, i) => `${i + 1}. **${st.title}** (${st.estimatedMinutes}m)`).join('\n')}

Total estimated effort: **${decomposed.totalMinutes} minutes**.`,
        toolCalls,
      };
    }

    // 3. Intent: Daily Summary / Focus Briefing / "What should I do?"
    if (lower.includes('what should i do') || lower.includes('focus') || lower.includes('briefing') || lower.includes('standup') || lower.includes('summary') || lower.includes('priority')) {
      const today = new Date().toISOString().split('T')[0];
      const pendingTasks = currentTasks.filter((t) => t.status !== 'done');
      const urgentImportant = pendingTasks.filter((t) => t.quadrant === 'do_first' || t.priority === 'urgent');
      const dueToday = pendingTasks.filter((t) => t.dueDate === today);
      const overdue = pendingTasks.filter((t) => t.dueDate && t.dueDate < today);

      toolCalls.push({
        toolName: 'generate_productivity_briefing',
        description: 'Analyzed current task matrix and pending deadlines',
        status: 'success',
        resultSummary: `Found ${pendingTasks.length} pending tasks (${urgentImportant.length} critical, ${overdue.length} overdue)`,
      });

      const top3 = (urgentImportant.length > 0 ? urgentImportant : pendingTasks).slice(0, 3);

      return {
        message: `### 🎯 Daily Focus & Productivity Briefing

- **Pending Tasks**: ${pendingTasks.length} total (${dueToday.length} due today, ${overdue.length} overdue)
- **Quadrant I (Do First)**: ${urgentImportant.length} critical items

**Recommended Top 3 Focus for Today:**
${top3.map((t, i) => `${i + 1}. **${t.title}** (${t.priority.toUpperCase()} priority${t.estimatedMinutes ? ` • ~${t.estimatedMinutes}m` : ''})`).join('\n')}

${overdue.length > 0 ? `\n⚠️ *You have ${overdue.length} overdue tasks.* You can say *"Reschedule overdue"* to bump them to today.` : ''}`,
        toolCalls,
      };
    }

    // 4. Intent: Direct Task Creation ("add task", "create task", "remind me to", "new task")
    if (lower.startsWith('add') || lower.startsWith('create') || lower.startsWith('remind me to') || lower.startsWith('new task') || lower.startsWith('todo:')) {
      const cleanTitle = input
        .replace(/^(add task|create task|remind me to|new task|todo:|add)\s*/i, '')
        .trim();

      // Extract priority if mentioned
      let priority: Priority = 'medium';
      if (lower.includes('urgent') || lower.includes('asap')) priority = 'urgent';
      else if (lower.includes('high priority') || lower.includes('important')) priority = 'high';
      else if (lower.includes('low priority')) priority = 'low';

      // Extract tag if mentioned
      const tags: string[] = ['AI-Agent'];
      if (lower.includes('work')) tags.push('Work');
      if (lower.includes('personal') || lower.includes('health')) tags.push('Personal');
      if (lower.includes('study') || lower.includes('learning')) tags.push('Learning');

      // Date parsing heuristics
      let dueDate = new Date().toISOString().split('T')[0];
      if (lower.includes('tomorrow')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dueDate = d.toISOString().split('T')[0];
      } else if (lower.includes('next week')) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        dueDate = d.toISOString().split('T')[0];
      }

      const quadrant: MatrixQuadrant = priority === 'urgent' || priority === 'high' ? 'do_first' : 'schedule';

      const task = store.addTask({
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        priority,
        quadrant,
        dueDate,
        tags,
        estimatedMinutes: 30,
        aiGenerated: true,
      });

      toolCalls.push({
        toolName: 'create_task',
        description: `Created new task with ${priority} priority`,
        status: 'success',
        resultSummary: `Added "${task.title}" (Due: ${dueDate}, Priority: ${priority})`,
        affectedTaskIds: [task.id],
      });

      return {
        message: `I've created the task **"${task.title}"** scheduled for **${dueDate}** with **${priority.toUpperCase()}** priority.`,
        toolCalls,
      };
    }

    // 5. Intent: Eisenhower Matrix Reorganization
    if (lower.includes('eisenhower') || lower.includes('matrix') || lower.includes('reorganize') || lower.includes('re-prioritize')) {
      let updatedCount = 0;
      currentTasks.forEach((t) => {
        let quad: MatrixQuadrant = t.quadrant;
        if (t.priority === 'urgent') quad = 'do_first';
        else if (t.priority === 'high') quad = 'schedule';
        else if (t.priority === 'medium') quad = 'delegate';
        else quad = 'eliminate';

        if (quad !== t.quadrant) {
          store.updateTask(t.id, { quadrant: quad });
          updatedCount++;
        }
      });

      toolCalls.push({
        toolName: 'reorganize_eisenhower_matrix',
        description: 'Auto-balanced all tasks across the 4 Eisenhower Matrix quadrants',
        status: 'success',
        resultSummary: `Updated ${updatedCount} task quadrant assignments`,
      });

      return {
        message: `I've evaluated your task workload and balanced **${updatedCount} tasks** into the Eisenhower 4-quadrant system (Do First, Schedule, Delegate, Eliminate). Check the **Eisenhower View** to see the organized matrix!`,
        toolCalls,
      };
    }

    // Default Help / Fallback Dialogue
    return {
      message: `I understand! Here is what I can autonomously perform for you:
- 📋 **Goal Decomposition**: Type *"Break down [any goal]"* to automatically generate subtasks & time estimates.
- ⏱️ **Schedule Triage**: Type *"Reschedule overdue tasks"* to bring overdue items up to date.
- 🎯 **Daily Standup**: Type *"What should I focus on today?"* to get your top 3 prioritized tasks.
- ➕ **Natural Capture**: Type *"Add task to finish quarterly report tomorrow high priority"*.
- 🗂️ **Eisenhower Balance**: Type *"Reorganize tasks with Eisenhower matrix"*.`,
      toolCalls: [],
    };
  }

  /**
   * Generates realistic subtasks tailored to goal keywords
   */
  private static generateSubtasksForGoal(goal: string): { subtasks: Subtask[]; totalMinutes: number } {
    const lower = goal.toLowerCase();
    let titles: { title: string; min: number }[] = [];

    if (lower.includes('launch') || lower.includes('release') || lower.includes('product')) {
      titles = [
        { title: 'Define launch objectives and target audience metrics', min: 25 },
        { title: 'Finalize core deliverables & QA testing sign-off', min: 45 },
        { title: 'Prepare announcement copy, email blast, & changelog', min: 30 },
        { title: 'Publish release build & verify production health', min: 20 },
        { title: 'Monitor incoming user telemetry & initial feedback', min: 30 },
      ];
    } else if (lower.includes('research') || lower.includes('study') || lower.includes('learn') || lower.includes('paper')) {
      titles = [
        { title: 'Survey foundational literature & bookmark key citations', min: 30 },
        { title: 'Synthesize core methodology & extract empirical takeaways', min: 45 },
        { title: 'Draft technical summary & concept flashcards', min: 25 },
        { title: 'Build a hands-on proof of concept / sandbox test', min: 50 },
      ];
    } else if (lower.includes('trip') || lower.includes('travel') || lower.includes('vacation')) {
      titles = [
        { title: 'Confirm itinerary dates & book accommodations', min: 30 },
        { title: 'Create packing checklist for essentials & gear', min: 15 },
        { title: 'Map out key destinations, activities & dining spots', min: 25 },
        { title: 'Review travel alerts & download offline maps', min: 15 },
      ];
    } else if (lower.includes('podcast') || lower.includes('video') || lower.includes('content') || lower.includes('youtube')) {
      titles = [
        { title: 'Outline episode talking points & guest questions', min: 30 },
        { title: 'Record raw audio/video session with test check', min: 60 },
        { title: 'Edit timeline, balance audio levels & add intro/outro', min: 45 },
        { title: 'Design compelling thumbnail and SEO-optimized title', min: 20 },
        { title: 'Publish & distribute across social media channels', min: 15 },
      ];
    } else {
      titles = [
        { title: `Clarify requirements & success criteria for ${goal}`, min: 20 },
        { title: `Gather prerequisites & relevant reference materials`, min: 25 },
        { title: `Execute core phase 1 implementation steps`, min: 45 },
        { title: `Review output, test edge cases, and refine details`, min: 30 },
        { title: `Wrap up documentation & mark final sign-off`, min: 15 },
      ];
    }

    const subtasks: Subtask[] = titles.map((t, idx) => ({
      id: `st-gen-${Date.now()}-${idx}`,
      title: t.title,
      completed: false,
      estimatedMinutes: t.min,
    }));

    const totalMinutes = titles.reduce((acc, t) => acc + t.min, 0);
    return { subtasks, totalMinutes };
  }

  /**
   * Gemini API Adapter
   */
  private static async callGeminiAgent(input: string, apiKey: string, currentTasks: Task[]): Promise<AgentResponse> {
    const prompt = `You are an AI To-Do & Productivity Agent. The user says: "${input}".
Current task list summary (${currentTasks.length} tasks):
${currentTasks.slice(0, 15).map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate || 'none'})`).join('\n')}

Respond in markdown with helpful productivity advice and specify any actions you recommend.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

    return {
      message: text,
      toolCalls: [
        {
          toolName: 'gemini_assistant_query',
          description: 'Consulted Gemini 1.5 Flash for agent instructions',
          status: 'success',
          resultSummary: 'Generated contextual productivity response',
        }
      ],
    };
  }

  /**
   * OpenAI Compatible API Adapter
   */
  private static async callOpenAIAgent(input: string, apiKey: string, baseUrl?: string, currentTasks?: Task[]): Promise<AgentResponse> {
    const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an autonomous productivity assistant managing tasks.' },
          { role: 'user', content: `Current tasks: ${JSON.stringify(currentTasks?.slice(0, 10))}\n\nUser: ${input}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'No response from OpenAI.';

    return {
      message,
      toolCalls: [
        {
          toolName: 'openai_assistant_query',
          description: 'Processed natural language request via OpenAI endpoint',
          status: 'success',
          resultSummary: 'Returned task management recommendations',
        }
      ],
    };
  }
}
