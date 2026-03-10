#!/usr/bin/env node
/**
 * Trello Sync Script
 * Parses trello-roadmap.md and syncs tasks to a Trello board
 * 
 * Features:
 * - Creates one card per section with tasks as checklist items
 * - Maintains position ordering from the plan file
 * - Creates separate lists per Phase
 * 
 * Usage:
 *   node sync.js           - Full sync
 *   node sync.js --dry-run - Preview changes without making them
 *   node sync.js --clean   - Delete all cards before syncing (fresh start)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAN_FIRST = process.argv.includes('--clean');

// Trello API base URL
const TRELLO_API = 'https://api.trello.com/1';

/**
 * Parse the trello-roadmap.md file and extract sections with tasks
 */
function parsePlanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Normalize line endings and split
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  const sections = [];
  let currentPhase = '';
  let currentSection = null;
  let sectionOrder = 0;
  
  for (const rawLine of lines) {
    // Trim trailing whitespace but preserve leading
    const line = rawLine.trimEnd();
    
    // Match phase headers (### Phase X: Name)
    const phaseMatch = line.match(/^###\s+(Phase\s+\d+[:\s].*)$/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      continue;
    }
    
    // Match section headers (#### X.X Name)
    const sectionMatch = line.match(/^####\s+(\d+\.\d+\s+.*)$/);
    if (sectionMatch) {
      // Save previous section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        name: sectionMatch[1].trim(),
        phase: currentPhase,
        phaseLabel: currentPhase.split(':')[0].trim(), // "Phase 1", "Phase 2", etc.
        order: sectionOrder++,
        tasks: [],
        completedCount: 0,
        totalCount: 0,
      };
      continue;
    }
    
    // Match task items (- [ ] or - [x])
    const taskMatch = line.match(/^-\s*\[([ xX])\]\s+(.+)$/);
    if (taskMatch && currentSection) {
      const isComplete = taskMatch[1].toLowerCase() === 'x';
      const taskText = taskMatch[2].trim();
      
      // Skip LEGAL notes - they're reminders, not tasks
      if (taskText.startsWith('**LEGAL:**')) {
        continue;
      }
      
      currentSection.tasks.push({
        title: taskText,
        complete: isComplete,
      });
      currentSection.totalCount++;
      if (isComplete) {
        currentSection.completedCount++;
      }
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Make a Trello API request
 */
async function trelloRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(`${TRELLO_API}${endpoint}`);
  url.searchParams.append('key', TRELLO_API_KEY);
  url.searchParams.append('token', TRELLO_TOKEN);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Trello API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Get or create phase-based lists on the board
 */
async function getOrCreatePhaseLists(phases) {
  const existingLists = await trelloRequest(`/boards/${TRELLO_BOARD_ID}/lists`);
  const listMap = {};
  
  // Sort phases to ensure correct order
  const sortedPhases = [...phases].sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
  
  // Create lists in reverse order so they appear correctly (Trello adds to left)
  for (const phase of sortedPhases.reverse()) {
    const existing = existingLists.find(l => l.name === phase);
    if (existing) {
      listMap[phase] = existing.id;
    } else {
      const list = await trelloRequest(`/boards/${TRELLO_BOARD_ID}/lists`, 'POST', { 
        name: phase,
        pos: 'top',
      });
      listMap[phase] = list.id;
      console.log(`📋 Created list: ${phase}`);
    }
  }
  
  return listMap;
}

/**
 * Delete all cards on the board (for --clean flag)
 */
async function deleteAllCards() {
  console.log('🗑️  Cleaning board - deleting all cards...\n');
  const cards = await trelloRequest(`/boards/${TRELLO_BOARD_ID}/cards`);
  
  for (const card of cards) {
    await trelloRequest(`/cards/${card.id}`, 'DELETE');
  }
  
  console.log(`   Deleted ${cards.length} cards\n`);
}

/**
 * Get existing cards on the board
 */
async function getExistingCards() {
  const cards = await trelloRequest(`/boards/${TRELLO_BOARD_ID}/cards`);
  return cards;
}

/**
 * Get checklists for a card
 */
async function getCardChecklists(cardId) {
  return await trelloRequest(`/cards/${cardId}/checklists`);
}

/**
 * Create a checklist on a card
 */
async function createChecklist(cardId, name) {
  return await trelloRequest(`/cards/${cardId}/checklists`, 'POST', { name });
}

/**
 * Add an item to a checklist
 */
async function addChecklistItem(checklistId, name, checked) {
  return await trelloRequest(`/checklists/${checklistId}/checkItems`, 'POST', {
    name,
    checked,
  });
}

/**
 * Update checklist item state
 */
async function updateChecklistItem(cardId, checkItemId, checked) {
  return await trelloRequest(`/cards/${cardId}/checkItem/${checkItemId}`, 'PUT', {
    state: checked ? 'complete' : 'incomplete',
  });
}

/**
 * Calculate section status based on task completion
 */
function getSectionStatus(section) {
  if (section.completedCount === section.totalCount && section.totalCount > 0) {
    return 'done';
  } else if (section.completedCount > 0) {
    return 'in-progress';
  }
  return 'todo';
}

/**
 * Sync sections to Trello as cards with checklists
 */
async function syncToTrello(sections) {
  const totalTasks = sections.reduce((sum, s) => sum + s.totalCount, 0);
  console.log(`\n📋 Found ${sections.length} sections with ${totalTasks} total tasks\n`);
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN - No changes will be made\n');
  }
  
  // Clean board if requested
  if (CLEAN_FIRST && !DRY_RUN) {
    await deleteAllCards();
  }
  
  // Get unique phases for lists (use full phase name like "Phase 1: Foundation")
  const phases = [...new Set(sections.map(s => s.phase))];
  
  // Get or create phase-based lists
  const phaseLists = DRY_RUN 
    ? Object.fromEntries(phases.map(p => [p, `${p}_LIST`]))
    : await getOrCreatePhaseLists(phases);
  
  // Get existing cards
  const existingCards = DRY_RUN ? [] : await getExistingCards();
  
  // Track stats
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  
  // Process each section as a card
  for (const section of sections) {
    const cardName = section.name;
    const progress = `[${section.completedCount}/${section.totalCount}]`;
    const targetList = phaseLists[section.phase];
    
    // Check if card already exists (by name)
    const existingCard = existingCards.find(c => c.name === cardName);
    
    if (DRY_RUN) {
      console.log(`📄 Would create/update: "${cardName}" ${progress} in ${section.phase}`);
      section.tasks.forEach(task => {
        const check = task.complete ? '✓' : '○';
        console.log(`   ${check} ${task.title}`);
      });
      created++;
      continue;
    }
    
    if (existingCard) {
      // Update existing card - sync checklist items
      const checklists = await getCardChecklists(existingCard.id);
      let checklist = checklists.find(cl => cl.name === 'Tasks');
      
      if (!checklist) {
        checklist = await createChecklist(existingCard.id, 'Tasks');
      }
      
      // Get existing checklist items
      const existingItems = checklist.checkItems || [];
      
      // Update or add checklist items
      for (const task of section.tasks) {
        const existingItem = existingItems.find(i => i.name === task.title);
        
        if (existingItem) {
          const isComplete = existingItem.state === 'complete';
          if (isComplete !== task.complete) {
            await updateChecklistItem(existingCard.id, existingItem.id, task.complete);
          }
        } else {
          await addChecklistItem(checklist.id, task.title, task.complete);
        }
      }
      
      console.log(`🔄 Updated: "${cardName}" ${progress}`);
      updated++;
    } else {
      // Create new card with checklist
      const cardDesc = `**Phase:** ${section.phase}\n\nProgress: ${progress}`;
      
      const newCard = await trelloRequest('/cards', 'POST', {
        name: cardName,
        desc: cardDesc,
        idList: targetList,
        pos: section.order * 65536, // Maintain order within list
      });
      
      // Create checklist with tasks
      const checklist = await createChecklist(newCard.id, 'Tasks');
      
      for (const task of section.tasks) {
        await addChecklistItem(checklist.id, task.title, task.complete);
      }
      
      console.log(`➕ Created: "${cardName}" ${progress}`);
      created++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Sync Summary:');
  console.log(`   Cards created: ${created}`);
  console.log(`   Cards updated: ${updated}`);
  console.log(`   Unchanged: ${unchanged}`);
  console.log('='.repeat(50));
}

/**
 * Main entry point
 */
async function main() {
  console.log('🔄 Trello Sync for trello-roadmap.md\n');
  
  // Validate environment
  if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
    console.error('❌ Missing environment variables. Please set:');
    console.error('   - TRELLO_API_KEY');
    console.error('   - TRELLO_TOKEN');
    console.error('   - TRELLO_BOARD_ID');
    console.error('\nCopy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }
  
  // Find the plan file
  const planPath = path.join(__dirname, '../../docs/plans/trello-roadmap.md');
  
  if (!fs.existsSync(planPath)) {
    console.error(`❌ Plan file not found: ${planPath}`);
    process.exit(1);
  }
  
  console.log(`📄 Reading: ${planPath}\n`);
  
  // Parse sections with tasks
  const sections = parsePlanFile(planPath);
  
  if (sections.length === 0) {
    console.log('⚠️ No sections found in plan file');
    process.exit(0);
  }
  
  // Show breakdown
  const totalTasks = sections.reduce((sum, s) => sum + s.totalCount, 0);
  const completedTasks = sections.reduce((sum, s) => sum + s.completedCount, 0);
  const phases = [...new Set(sections.map(s => s.phase))];
  
  console.log(`📊 Found ${sections.length} sections across ${phases.length} phases`);
  console.log(`   Tasks: ${completedTasks}/${totalTasks} completed\n`);
  
  if (CLEAN_FIRST) {
    console.log('⚠️  --clean flag detected: will delete existing cards first\n');
  }
  
  // Sync to Trello
  await syncToTrello(sections);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
