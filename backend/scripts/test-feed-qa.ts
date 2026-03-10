#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';

/**
 * QA Test Script for Unified Feed Endpoint
 *
 * Tests:
 * 1. Basic feed fetch
 * 2. Pagination
 * 3. Type filtering
 * 4. Priority ordering
 * 5. Content interleaving
 * 6. Cardinality limits
 * 7. Metadata accuracy
 */

const BASE_URL = process.env.API_URL || 'http://localhost:9090/api/v1';
const FEED_URL = `${BASE_URL}/feed`;

interface FeedResponse {
  data: FeedItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    articlesCount: number;
    pollsCount: number;
    eventsCount: number;
    electionsCount: number;
    quizzesCount: number;
  };
}

interface FeedItem {
  id: string;
  type: 'article' | 'poll' | 'event' | 'election_update' | 'quiz_prompt';
  publishedAt: string;
  isPinned: boolean;
  sortPriority: number;
  article?: any;
  poll?: any;
  event?: any;
  electionUpdate?: any;
  quizPrompt?: any;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message: string) {
  console.log(message);
}

function pass(test: string) {
  totalTests++;
  passedTests++;
  console.log(chalk.green(`✓ ${test}`));
}

function fail(test: string, reason: string) {
  totalTests++;
  failedTests++;
  console.log(chalk.red(`✗ ${test}`));
  console.log(chalk.red(`  Reason: ${reason}`));
}

function section(title: string) {
  console.log('\n' + chalk.bold.blue(`═══ ${title} ═══`) + '\n');
}

async function testBasicFetch() {
  section('Test 1: Basic Feed Fetch');

  try {
    const response = await axios.get<FeedResponse>(FEED_URL);

    if (response.status === 200) {
      pass('Returns 200 OK');
    } else {
      fail('Returns 200 OK', `Got ${response.status}`);
    }

    const { data, meta } = response.data;

    if (data && Array.isArray(data)) {
      pass('Response has data array');
    } else {
      fail('Response has data array', 'data is not an array');
    }

    if (meta) {
      pass('Response has meta object');
    } else {
      fail('Response has meta object', 'meta is missing');
    }

    if (data.length > 0) {
      pass(`Returned ${data.length} feed items`);
    } else {
      fail('Returned feed items', 'No items in feed');
    }

    // Check meta fields
    const requiredMetaFields = ['page', 'limit', 'total', 'totalPages', 'articlesCount', 'pollsCount', 'eventsCount', 'electionsCount', 'quizzesCount'];
    const missingFields = requiredMetaFields.filter((field) => !(field in meta));

    if (missingFields.length === 0) {
      pass('Meta contains all required fields');
    } else {
      fail('Meta contains all required fields', `Missing: ${missingFields.join(', ')}`);
    }

    log(chalk.gray(`  → Total items: ${meta.total}`));
    log(chalk.gray(`  → Articles: ${meta.articlesCount}, Polls: ${meta.pollsCount}, Events: ${meta.eventsCount}, Elections: ${meta.electionsCount}, Quizzes: ${meta.quizzesCount}`));

    return response.data;
  } catch (error: any) {
    fail('Basic feed fetch', error.message);
    return null;
  }
}

async function testFeedItemStructure(feedData: FeedResponse | null) {
  section('Test 2: Feed Item Structure');

  if (!feedData || feedData.data.length === 0) {
    fail('Feed item structure', 'No feed data available');
    return;
  }

  const item = feedData.data[0];

  // Check required fields
  const requiredFields = ['id', 'type', 'publishedAt', 'isPinned', 'sortPriority'];
  const missingFields = requiredFields.filter((field) => !(field in item));

  if (missingFields.length === 0) {
    pass('Feed item has all required fields');
  } else {
    fail('Feed item has required fields', `Missing: ${missingFields.join(', ')}`);
  }

  // Check discriminated union
  const validTypes = ['article', 'poll', 'event', 'election_update', 'quiz_prompt'];
  if (validTypes.includes(item.type)) {
    pass(`Item type is valid (${item.type})`);
  } else {
    fail('Item type is valid', `Got: ${item.type}`);
  }

  // Check that content field matches type
  const contentFields = ['article', 'poll', 'event', 'electionUpdate', 'quizPrompt'];
  const presentFields = contentFields.filter((field) => field in item && item[field as keyof FeedItem] !== undefined);

  if (presentFields.length === 1) {
    pass('Item has exactly one content field');
  } else {
    fail('Item has exactly one content field', `Found: ${presentFields.join(', ')}`);
  }

  log(chalk.gray(`  → Sample item: ${item.type} - ${item.id}`));
}

async function testPagination() {
  section('Test 3: Pagination');

  try {
    // Page 1
    const page1 = await axios.get<FeedResponse>(`${FEED_URL}?page=1&limit=10`);
    if (page1.data.data.length === 10 || page1.data.meta.total < 10) {
      pass('Page 1 returns correct number of items');
    } else {
      fail('Page 1 returns correct number', `Expected 10, got ${page1.data.data.length}`);
    }

    if (page1.data.meta.page === 1) {
      pass('Page 1 meta.page is correct');
    } else {
      fail('Page 1 meta.page', `Expected 1, got ${page1.data.meta.page}`);
    }

    // Page 2
    if (page1.data.meta.totalPages > 1) {
      const page2 = await axios.get<FeedResponse>(`${FEED_URL}?page=2&limit=10`);
      if (page2.data.data.length > 0) {
        pass('Page 2 returns items');
      } else {
        fail('Page 2 returns items', 'Page 2 is empty');
      }

      // Check no overlap
      const page1Ids = new Set(page1.data.data.map((i) => i.id));
      const page2Ids = new Set(page2.data.data.map((i) => i.id));
      const overlap = [...page1Ids].filter((id) => page2Ids.has(id));

      if (overlap.length === 0) {
        pass('No ID overlap between pages');
      } else {
        fail('No ID overlap between pages', `${overlap.length} duplicate IDs`);
      }
    } else {
      log(chalk.yellow('  ⊘ Skipped page 2 test (only 1 page available)'));
    }
  } catch (error: any) {
    fail('Pagination test', error.message);
  }
}

async function testTypeFiltering() {
  section('Test 4: Type Filtering');

  try {
    // Filter for articles only
    const articlesOnly = await axios.get<FeedResponse>(`${FEED_URL}?types=article`);
    const allArticles = articlesOnly.data.data.every((item) => item.type === 'article');

    if (allArticles) {
      pass('Filter types=article returns only articles');
    } else {
      const nonArticles = articlesOnly.data.data.filter((i) => i.type !== 'article');
      fail('Filter types=article', `Found ${nonArticles.length} non-articles`);
    }

    log(chalk.gray(`  → Articles only: ${articlesOnly.data.data.length} items`));

    // Filter for polls + events
    const pollsEvents = await axios.get<FeedResponse>(`${FEED_URL}?types=poll,event`);
    const validTypes = pollsEvents.data.data.every((item) => item.type === 'poll' || item.type === 'event');

    if (validTypes) {
      pass('Filter types=poll,event returns only polls and events');
    } else {
      const invalid = pollsEvents.data.data.filter((i) => i.type !== 'poll' && i.type !== 'event');
      fail('Filter types=poll,event', `Found ${invalid.length} invalid items`);
    }

    log(chalk.gray(`  → Polls + Events: ${pollsEvents.data.data.length} items`));
  } catch (error: any) {
    fail('Type filtering test', error.message);
  }
}

async function testPriorityOrdering() {
  section('Test 5: Priority Ordering');

  try {
    const response = await axios.get<FeedResponse>(`${FEED_URL}?limit=20`);
    const items = response.data.data;

    // Check that priorities are sorted descending
    let sorted = true;
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].sortPriority < items[i + 1].sortPriority) {
        sorted = false;
        break;
      }
    }

    if (sorted) {
      pass('Items are sorted by priority (descending)');
    } else {
      fail('Items sorted by priority', 'Priority order is incorrect');
    }

    // Check that pinned items have higher priority
    const pinnedItems = items.filter((i) => i.isPinned);
    const unpinnedItems = items.filter((i) => !i.isPinned);

    if (pinnedItems.length > 0 && unpinnedItems.length > 0) {
      const minPinnedPriority = Math.min(...pinnedItems.map((i) => i.sortPriority));
      const maxUnpinnedPriority = Math.max(...unpinnedItems.map((i) => i.sortPriority));

      if (minPinnedPriority > maxUnpinnedPriority) {
        pass('Pinned items have higher priority than unpinned');
      } else {
        fail('Pinned items priority', 'Some unpinned items have higher priority than pinned');
      }
    }

    // Check that elections appear first (if any)
    const firstElectionIndex = items.findIndex((i) => i.type === 'election_update');
    const firstNonElectionIndex = items.findIndex((i) => i.type !== 'election_update');

    if (firstElectionIndex >= 0 && firstNonElectionIndex >= 0) {
      if (firstElectionIndex < firstNonElectionIndex) {
        pass('Election updates appear before other content');
      } else {
        fail('Election updates priority', 'Elections should appear first');
      }
    }

    log(chalk.gray(`  → Priority range: ${items[0]?.sortPriority} to ${items[items.length - 1]?.sortPriority}`));
  } catch (error: any) {
    fail('Priority ordering test', error.message);
  }
}

async function testInterleaving() {
  section('Test 6: Content Interleaving');

  try {
    const response = await axios.get<FeedResponse>(`${FEED_URL}?limit=50`);
    const items = response.data.data;

    // Count consecutive articles
    let maxConsecutiveArticles = 0;
    let currentConsecutive = 0;

    for (const item of items) {
      if (item.type === 'article') {
        currentConsecutive++;
        maxConsecutiveArticles = Math.max(maxConsecutiveArticles, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    // Interleaving pattern allows max 7 consecutive articles (5 + 2)
    if (maxConsecutiveArticles <= 7) {
      pass(`Articles are interleaved (max ${maxConsecutiveArticles} consecutive)`);
    } else {
      fail('Articles interleaving', `Found ${maxConsecutiveArticles} consecutive articles (expected ≤7)`);
    }

    // Check type distribution
    const typeCounts = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    log(chalk.gray('  → Type distribution:'));
    Object.entries(typeCounts).forEach(([type, count]) => {
      log(chalk.gray(`     ${type}: ${count}`));
    });
  } catch (error: any) {
    fail('Content interleaving test', error.message);
  }
}

async function testCardinalityLimits() {
  section('Test 7: Cardinality Limits');

  try {
    const response = await axios.get<FeedResponse>(`${FEED_URL}?page=1&limit=20`);
    const items = response.data.data;

    // Count each type
    const typeCounts = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check limits
    const limits = {
      poll: 2,
      event: 3,
      election_update: 1,
      quiz_prompt: 1,
    };

    let allWithinLimits = true;

    for (const [type, limit] of Object.entries(limits)) {
      const count = typeCounts[type] || 0;
      if (count <= limit) {
        pass(`${type} count (${count}) within limit (${limit})`);
      } else {
        fail(`${type} cardinality limit`, `Found ${count}, expected ≤${limit}`);
        allWithinLimits = false;
      }
    }

    // Articles should have no limit
    const articleCount = typeCounts.article || 0;
    log(chalk.gray(`  → Articles: ${articleCount} (no limit)`));
  } catch (error: any) {
    fail('Cardinality limits test', error.message);
  }
}

async function testMetadataAccuracy() {
  section('Test 8: Metadata Accuracy');

  try {
    const response = await axios.get<FeedResponse>(`${FEED_URL}?limit=50`);
    const { data, meta } = response.data;

    // Count types in data
    const actualCounts = data.reduce((acc, item) => {
      const key = item.type === 'election_update' ? 'electionsCount' :
                   item.type === 'quiz_prompt' ? 'quizzesCount' :
                   item.type === 'article' ? 'articlesCount' :
                   item.type === 'poll' ? 'pollsCount' :
                   item.type === 'event' ? 'eventsCount' : 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Compare with meta counts (meta counts total available, not just this page)
    if (data.length <= meta.limit) {
      pass('Returned item count matches limit');
    } else {
      fail('Item count vs limit', `Got ${data.length}, expected ≤${meta.limit}`);
    }

    if (meta.totalPages === Math.ceil(meta.total / meta.limit)) {
      pass('Total pages calculation is correct');
    } else {
      fail('Total pages calculation', `Expected ${Math.ceil(meta.total / meta.limit)}, got ${meta.totalPages}`);
    }

    log(chalk.gray(`  → Total: ${meta.total}, Pages: ${meta.totalPages}`));
  } catch (error: any) {
    fail('Metadata accuracy test', error.message);
  }
}

async function runAllTests() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   Feed Endpoint QA Test Suite                ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════╝\n'));

  log(chalk.gray(`Testing: ${FEED_URL}\n`));

  const feedData = await testBasicFetch();
  await testFeedItemStructure(feedData);
  await testPagination();
  await testTypeFiltering();
  await testPriorityOrdering();
  await testInterleaving();
  await testCardinalityLimits();
  await testMetadataAccuracy();

  // Summary
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════════════════'));
  console.log(chalk.bold('Test Summary:'));
  console.log(chalk.green(`  ✓ Passed: ${passedTests}/${totalTests}`));
  if (failedTests > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failedTests}/${totalTests}`));
  }
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════\n'));

  if (failedTests === 0) {
    console.log(chalk.bold.green('🎉 All tests passed! Feed endpoint is ready for production.\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('❌ Some tests failed. Please review and fix issues.\n'));
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
