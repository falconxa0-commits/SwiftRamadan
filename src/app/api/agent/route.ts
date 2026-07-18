// AI Agent Orchestrator — Single endpoint for all SwiftRamadan AI agents
// Handles: agent selection, conversation, tool calling, response generation

import { NextRequest, NextResponse } from 'next/server';
import { getAISDK, sanitizeInput } from '@/lib/ai/sdk';
import { getAgent, agents } from '@/lib/ai/agents';
import { executeTool, toolDefinitions } from '@/lib/ai/tools';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { AgentId, AgentMessage, AgentContext, ToolCall } from '@/lib/ai/types';

// ── POST: Send a message to an agent ──
export async function POST(request: NextRequest) {
  // Auth check
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limit
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { agentId, message, messages = [], context = {} } = body as {
      agentId: AgentId;
      message: string;
      messages?: AgentMessage[];
      context?: Record<string, unknown>;
    };

    // Validate agent
    const agent = getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 });
    }

    // Check role access
    if (!agent.roles.includes(auth.role)) {
      return NextResponse.json({ error: 'You do not have access to this agent' }, { status: 403 });
    }

    // Sanitize input
    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Build context
    const agentContext: AgentContext = {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      userName: (context.userName as string) || auth.email.split('@')[0],
      ...context,
    };

    // Get the AI SDK
    const zai = await getAISDK();

    // Build conversation messages
    const systemMessage = buildSystemMessage(agent, agentContext);
    const conversationHistory = (messages as AgentMessage[])
      .slice(-10) // Keep last 10 messages for context
      .map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    // Build tool definitions for this agent
    const availableTools = agent.tools.reduce((acc, toolName) => {
      const def = toolDefinitions[toolName];
      if (def) {
        acc[toolName] = {
          description: def.description,
          parameters: def.parameters,
        };
      }
      return acc;
    }, {} as Record<string, { description: string; parameters: Record<string, unknown> }>);

    // Call the AI with tools
    let response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemMessage },
        ...conversationHistory,
        { role: 'user', content: cleanMessage },
      ],
      tools: Object.keys(availableTools).length > 0 ? Object.entries(availableTools).map(([name, def]) => ({
        type: 'function' as const,
        function: {
          name,
          description: def.description,
          parameters: {
            type: 'object',
            properties: def.parameters,
          },
        },
      })) : undefined,
    });

    let assistantMessage = response.choices?.[0]?.message?.content || '';
    let toolCalls: ToolCall[] = [];
    let toolResults: unknown[] = [];

    // Handle tool calls from the AI response
    const aiToolCalls = response.choices?.[0]?.message?.tool_calls;
    if (aiToolCalls && aiToolCalls.length > 0) {
      // Execute each tool call
      for (const tc of aiToolCalls) {
        const toolName = tc.function.name;
        let toolArgs: Record<string, unknown> = {};
        
        try {
          toolArgs = JSON.parse(tc.function.arguments);
        } catch {
          toolArgs = {};
        }

        // Inject userId for tools that need it
        if ('userId' in (toolDefinitions[toolName]?.parameters || {}) && !toolArgs.userId) {
          toolArgs.userId = auth.userId;
        }
        if ('riderId' in (toolDefinitions[toolName]?.parameters || {}) && !toolArgs.riderId) {
          toolArgs.riderId = auth.userId;
        }
        if ('vendorId' in (toolDefinitions[toolName]?.parameters || {}) && !toolArgs.vendorId) {
          toolArgs.vendorId = auth.userId;
        }

        const result = await executeTool(toolName, toolArgs);
        toolCalls.push({ name: toolName, arguments: toolArgs });
        toolResults.push({ tool: toolName, result });

        // If the AI only made tool calls without text, make a follow-up call to generate a response
        if (!assistantMessage) {
          const followUp = await zai.chat.completions.create({
            model: 'default',
            messages: [
              { role: 'system', content: systemMessage },
              ...conversationHistory,
              { role: 'user', content: cleanMessage },
              {
                role: 'assistant',
                content: null,
                tool_calls: aiToolCalls.map(tc => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.function.name, arguments: tc.function.arguments },
                })),
              },
              ...aiToolCalls.map((tc, i) => ({
                role: 'tool' as const,
                content: JSON.stringify(toolResults[i]),
                tool_call_id: tc.id,
              })),
            ],
          });
          assistantMessage = followUp.choices?.[0]?.message?.content || '';
        }
      }
    }

    // If no response at all, use a fallback
    if (!assistantMessage) {
      assistantMessage = "I'm here to help! Could you tell me more about what you need?";
    }

    return NextResponse.json({
      message: assistantMessage,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      agentId,
    });

  } catch (error) {
    console.error('[Agent API] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// ── GET: List available agents for the current user ──
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const availableAgents = Object.values(agents)
    .filter(agent => agent.roles.includes(auth.role))
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      greeting: agent.greeting,
      quickActions: agent.quickActions,
    }));

  return NextResponse.json({ agents: availableAgents });
}

// Build the system message with context injection
function buildSystemMessage(agent: ReturnType<typeof getAgent>, context: AgentContext): string {
  if (!agent) return 'You are a helpful assistant.';

  let systemPrompt = agent.systemPrompt;

  // Inject user context
  systemPrompt += `\n\n--- USER CONTEXT ---`;
  systemPrompt += `\nUser: ${context.userName} (${context.email})`;
  systemPrompt += `\nRole: ${context.role}`;
  if (context.swiftPoints) systemPrompt += `\nSwiftPoints: ${context.swiftPoints}`;
  if (context.loyaltyTier) systemPrompt += `\nLoyalty Tier: ${context.loyaltyTier}`;
  if (context.dietaryPrefs?.length) systemPrompt += `\nDietary Preferences: ${context.dietaryPrefs.join(', ')}`;
  if (context.cartItems && Array.isArray(context.cartItems) && context.cartItems.length > 0) {
    systemPrompt += `\nCart Items: ${context.cartItems.length} items in cart`;
  }

  // Time-of-day context (Lagos timezone)
  const lagosHour = new Date().getHours() + 1; // WAT = UTC+1
  const hour = lagosHour % 24;
  let timeContext = '';
  if (hour >= 4 && hour < 6) timeContext = 'SAHUR TIME (pre-dawn meal)';
  else if (hour >= 6 && hour < 12) timeContext = 'MORNING';
  else if (hour >= 12 && hour < 16) timeContext = 'AFTERNOON';
  else if (hour >= 16 && hour < 20) timeContext = 'IFTAR TIME (evening break-fast)';
  else timeContext = 'EVENING/NIGHT';
  
  systemPrompt += `\nCurrent Time: ${timeContext} in Lagos, Nigeria`;
  systemPrompt += `\n--- END CONTEXT ---`;

  return systemPrompt;
}
