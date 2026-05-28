import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { weekId } = await req.json() as { weekId: string };
    if (!weekId) {
      return new Response(JSON.stringify({ error: 'weekId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [weekResult, tasksResult, logsResult, recentReportsResult] = await Promise.all([
      supabase.from('weeks').select('*').eq('id', weekId).eq('user_id', user.id).single(),
      supabase.from('tasks').select('*').eq('week_id', weekId).eq('user_id', user.id),
      supabase.from('daily_logs').select('*').eq('week_id', weekId).eq('user_id', user.id).order('log_date'),
      supabase.from('reports').select('overall_score, grade, week_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    ]);

    if (weekResult.error) throw weekResult.error;

    const week = weekResult.data as Record<string, unknown>;
    const tasks = (tasksResult.data ?? []) as Array<Record<string, unknown>>;
    const logs = (logsResult.data ?? []) as Array<Record<string, unknown>>;
    const recentReports = (recentReportsResult.data ?? []) as Array<Record<string, unknown>>;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.done).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const taskBreakdown = tasks
      .map((t) => `- [${t.done ? 'x' : ' '}] ${t.title} (${t.category}, ${t.priority} priority, ~${t.estimated_hours}h)`)
      .join('\n') || 'No tasks';

    const journalEntries = logs
      .map((l) => `${l.log_date}: ${l.content}`)
      .join('\n') || 'No journal entries';

    const trendContext = recentReports.length > 0
      ? recentReports.map((r) => `${r.week_id}: ${r.grade} (${r.overall_score}/100)`).join(', ')
      : 'No previous reports';

    const prompt = `You are WeekFlow's AI performance analyst. Evaluate this user's week and produce a structured performance report.

WEEK: ${weekId} (${week.label ?? 'Untitled Week'})
INTENTION: ${week.intention ?? 'Not set'}
ENERGY: Start ${week.energy_start ?? '?'}/5 → End ${week.energy_end ?? '?'}/5
FOCUS HOURS: ${week.focus_hours ?? 0}h

TASKS (${completedTasks}/${totalTasks} completed = ${completionRate}%):
${taskBreakdown}

JOURNAL ENTRIES:
${journalEntries}

RECENT PERFORMANCE TREND: ${trendContext}

Respond with a JSON object (no markdown, just raw JSON) with these exact fields:
- overallScore: number 0-100
- grade: "S" | "A" | "B" | "C" | "D"
- headline: string (one punchy sentence)
- wins: string[] (2-4 items)
- improvements: string[] (2-4 items)
- capacityInsight: string
- focusSuggestion: string
- nextWeekGoal: string
- motivationalNote: string
- dailyActivityInsight: string
- priorityAnalysis: string`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const reportData = JSON.parse(responseText) as Record<string, unknown>;

    const { data: savedReport, error: saveError } = await supabase
      .from('reports')
      .upsert(
        {
          week_id: weekId,
          user_id: user.id,
          overall_score: reportData.overallScore,
          grade: reportData.grade,
          headline: reportData.headline,
          wins: reportData.wins,
          improvements: reportData.improvements,
          capacity_insight: reportData.capacityInsight,
          focus_suggestion: reportData.focusSuggestion,
          next_week_goal: reportData.nextWeekGoal,
          motivational_note: reportData.motivationalNote,
          raw_json: reportData,
        },
        { onConflict: 'week_id' }
      )
      .select()
      .single();

    if (saveError) throw saveError;

    if (completionRate >= 80) {
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const existing = existingStreak as Record<string, unknown> | null;
      const newStreak = ((existing?.current_streak as number) ?? 0) + 1;

      await supabase.from('streaks').upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, (existing?.longest_streak as number) ?? 0),
        last_qualifying_week: weekId,
        updated_at: new Date().toISOString(),
      });
    }

    await supabase.from('weeks').update({ report_generated: true }).eq('id', weekId);

    return new Response(JSON.stringify(savedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
