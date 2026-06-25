/**
 * run_labeling_v2.js  —  Site24x7 Labeling Guide Generator (v2)
 *
 * Improvements over v1:
 *  1. HTTP-method intent detection (POST for create, PUT for update, DELETE for delete)
 *  2. Subject-term path matching: Mark-Correct endpoint MUST contain a core subject term
 *  3. Sheet-affinity bonus: results from the same feature sheet score higher
 *  4. Strict deduplication by (method + normalised endpoint)
 *  5. Tight Add-to-Dataset filter: endpoint path must share at least one subject term
 *  6. Manual overrides for ~50 known problematic questions
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const apis = data.apis;

// ─────────────────────────────────────────────────────────────────────────────
// Text utilities
// ─────────────────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','can','need','to','in','on','at','by','for',
  'with','about','against','between','into','through','during','before',
  'after','above','below','from','up','down','out','off','over','under',
  'again','further','then','once','here','there','when','where','why','how',
  'all','both','each','few','more','most','other','some','such','no','nor',
  'not','only','own','same','so','than','too','very','just','because','as',
  'until','while','of','and','or','that','this','these','those','it','its',
  'what','which','who','whom','me','my','i','give','tell','please','you',
]);

const GENERIC = new Set([
  'list','show','retrieve','check','view','fetch','create','delete','update',
  'configure','set','enable','disable','manage','find','get','available',
  'existing','specific','currently','previously','account','new','related',
  'holds','field','endpoint','api','use','used','using','returns','return',
  'status','result','results','report','reports','log','logs','data','info',
  'configuration','settings','setting','feature','features',
  'under','page','module','site24x7','site','monitor','monitors',
]);

function normEp(ep) {
  return ep.replace(/^https?:\/\/[^/]+/, '').toLowerCase();
}

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9_/\-.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function subjectTerms(q) {
  return tokenize(q).filter(t => t.length > 2 && !GENERIC.has(t));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method intent detection
// ─────────────────────────────────────────────────────────────────────────────
const CREATE_RE   = /\b(creat|add|post|set.?up|generat|build|register|store|send|publish|initiat|submit|make|new)\b/i;
const UPDATE_RE   = /\b(updat|edit|modif|chang|enabl|disabl|toggl)\b/i;
const DELETE_RE   = /\b(delet|remov|destroy)\b/i;
const RETRIEVE_RE = /\b(list|show|retriev|check|view|fetch|which api|what api|what endpoint|what field)\b/i;

function preferredMethod(q) {
  if (DELETE_RE.test(q)) return 'DELETE';
  if (CREATE_RE.test(q) && !RETRIEVE_RE.test(q)) return 'POST';
  if (UPDATE_RE.test(q) && !RETRIEVE_RE.test(q)) return 'PUT';
  return 'GET';
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────
function scoreResult(api, tokens, subjects, prefM, featureSheet) {
  let s = 0;
  const ep   = api.endpoint.toLowerCase();
  const sf   = api.subFeature.toLowerCase();
  const desc = api.description.toLowerCase();

  tokens.forEach(tok => {
    if (ep.includes(tok))   s += 12;
    if (sf.includes(tok))   s += 10;
    if (desc.includes(tok)) s +=  6;
    if (api.responseFields && api.responseFields.some(f => f.toLowerCase().includes(tok))) s += 7;
    if (api.requestFields  && api.requestFields.some(f  => f.toLowerCase().includes(tok))) s += 5;
    if (api.summaryText && api.summaryText.toLowerCase().includes(tok)) s += 4;
    if (api.searchText  && api.searchText.includes(tok))                s += 1;
  });

  const q = tokens.join(' ');
  if (sf.includes(q))   s += 20;
  if (desc.includes(q)) s += 15;
  if (ep.includes(q))   s += 18;

  subjects.forEach(sub => {
    if (ep.includes(sub))   s += 8;
    if (sf.includes(sub))   s += 5;
    if (desc.includes(sub)) s += 3;
  });

  // Method-intent bonus/penalty
  if (api.method === prefM)                          s += 15;
  if (api.method !== prefM && prefM !== 'GET')       s -=  5;

  // Sheet-affinity bonus
  if (featureSheet && api.sheet === featureSheet)    s += 12;

  return s;
}

function pathRelevant(api, subjects) {
  if (!subjects.length) return true;
  const ep = normEp(api.endpoint);
  return subjects.some(s => ep.includes(s));
}

function dedupKey(api) {
  return api.method + '|' + normEp(api.endpoint);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────
function search(q, featureSheet) {
  const tokens   = tokenize(q);
  const subjects = subjectTerms(q);
  const prefM    = preferredMethod(q);
  if (!tokens.length) return { scored: [], subjects, prefM };

  const scored = apis
    .map(api => ({ api, score: scoreResult(api, tokens, subjects, prefM, featureSheet) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return { scored, subjects, prefM };
}

function pickMarkCorrect(scored, subjects, prefM) {
  // Pass 1: right method + path contains subject term
  let p = scored.find(r => r.api.method === prefM && pathRelevant(r.api, subjects));
  // Pass 2: path contains subject term (any method)
  if (!p) p = scored.find(r => pathRelevant(r.api, subjects));
  // Pass 3: right method (any path)
  if (!p) p = scored.find(r => r.api.method === prefM);
  // Pass 4: top score
  if (!p) p = scored[0];
  return p;
}

function findApi(method, endpoint) {
  const norm = normEp(endpoint);
  return apis.find(a =>
    a.method === method &&
    (a.endpoint === endpoint || normEp(a.endpoint) === norm)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual overrides for known problematic questions
// Key: "<section>|<0-based question index>"
// ─────────────────────────────────────────────────────────────────────────────
const OVERRIDES = {
  // ── Inventory ──────────────────────────────────────────────────────────────
  'Inventory|0':  { mc: { m:'GET', ep:'/app/api/short/all/monitors' } },
  'Inventory|12': { mc: { m:'GET', ep:'/app/api/filters' },
                    ex: [{ m:'POST', ep:'/app/api/filters' }] },

  // ── User & Alert Management ────────────────────────────────────────────────
  'User & Alert Management|1':  { mc: { m:'GET', ep:'/app/api/short/custom_roles' },
                                   ex: [{ m:'GET', ep:'/app/api/short/users_list' }] },
  'User & Alert Management|10': { mc: { m:'GET', ep:'/app/api/alarms_category' },
                                   ex: [{ m:'PUT', ep:'/app/api/alarms_category/{id}' }] },
  'User & Alert Management|13': { mc: { m:'GET', ep:'/app/api/short/custom_roles' },
                                   ex: [{ m:'GET', ep:'/app/api/client_data/user' }] },
  'User & Alert Management|14': { mc: { m:'GET', ep:'/app/api/short/attribute_groups' },
                                   ex: [{ m:'GET', ep:'/app/api/attribute_groups' }] },

  // ── Configuration Profiles ─────────────────────────────────────────────────
  'Configuration Profiles|2':  { mc: { m:'POST', ep:'https://www.site24x7.com/app/api/notification_profiles' },
                                  ex: [{ m:'GET',  ep:'https://www.site24x7.com/app/api/notification_profiles' },
                                       { m:'GET',  ep:'/app/api/short/notification_profiles' }] },
  'Configuration Profiles|7':  { mc: { m:'POST', ep:'https://www.site24x7.com/app/api/apminsight/agent_config_profile' },
                                  ex: [{ m:'GET',  ep:'https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA' },
                                       { m:'GET',  ep:'/app/api/short/apminsight/agent_config_profiles' }] },
  'Configuration Profiles|8':  { mc: { m:'POST', ep:'https://www.site24x7.com/app/api/apminsight/business_txn_rules' },
                                  ex: [{ m:'GET',  ep:'https://www.site24x7.com/app/api/short/apminsight/business_txn_rules' },
                                       { m:'PUT',  ep:'https://www.site24x7.com/app/api/apminsight/business_txn_rules/{id}' }] },
  'Configuration Profiles|14': { mc: { m:'POST', ep:'https://www.site24x7.com/app/api/reports/custom_reports/preview' },
                                  ex: [{ m:'GET',  ep:'/app/api/short/reports/custom_reports' },
                                       { m:'GET',  ep:'/app/api/reports/custom_reports' }] },

  // ── Automations ────────────────────────────────────────────────────────────
  'Automations|0':  { mc: { m:'GET', ep:'/app/api/it_automation' },
                      ex: [{ m:'GET', ep:'/app/api/it_automation_types' },
                           { m:'GET', ep:'/app/api/it_automation/settings' }] },
  'Automations|6':  { mc: { m:'GET', ep:'/app/api/file_list' },
                      ex: [{ m:'GET', ep:'/app/api/it_automation/list' }] },
  'Automations|8':  { mc: { m:'PUT', ep:'/app/api/reports/outage/{id}' },
                      ex: [{ m:'GET', ep:'/app/api/scheduled_reports' }] },
  'Automations|9':  { mc: { m:'GET', ep:'/app/api/sla_settings' },
                      ex: [{ m:'GET', ep:'/app/api/short/sla_settings/monitors/2' },
                           { m:'GET', ep:'/app/api/short/sla_settings/monitors/3' }] },
  'Automations|14': { mc: { m:'GET', ep:'/app/api/tags/monitors' },
                      ex: [{ m:'GET', ep:'/app/api/it_automation/monitor/status_details/{id}' }] },

  // ── Zia Settings ───────────────────────────────────────────────────────────
  'Zia Settings|1':  { mc: { m:'GET', ep:'/app/api/genai/recommendation' } },
  'Zia Settings|8':  { mc: { m:'GET', ep:'/app/api/genai/workflow/kubernets_assistant' },
                       ex: [{ m:'GET', ep:'/app/api/genai/workflow/alarms_assistant' },
                            { m:'GET', ep:'/app/api/genai/workflow/apm_assistant' },
                            { m:'GET', ep:'/app/api/genai/workflow/server_assistant' }] },
  'Zia Settings|10': { mc: { m:'GET', ep:'/app/api/genai/collections' },
                       ex: [{ m:'GET', ep:'/app/api/genai/module/monitorlist' }] },
  'Zia Settings|13': { mc: { m:'GET', ep:'/app/api/genai/recommendation' },
                       ex: [{ m:'GET', ep:'/app/api/it_automation/monitor/status_details/{id}' }] },
  'Zia Settings|14': { mc: { m:'GET', ep:'/app/api/genai/workflows' },
                       ex: [{ m:'GET', ep:'/app/api/genai/workflow/alarms_assistant' },
                            { m:'GET', ep:'/app/api/genai/workflow/apm_assistant' },
                            { m:'GET', ep:'/app/api/genai/workflow/problems_assistant' },
                            { m:'GET', ep:'/app/api/genai/tasks' }] },

  // ── Server Monitor ─────────────────────────────────────────────────────────
  'Server Monitor|1': { mc: { m:'GET', ep:'/app/api/resource_profile' },
                        ex: [{ m:'GET', ep:'/app/api/resource_profile/{id}' },
                             { m:'GET', ep:'/app/api/short/resource_profile' }] },
  'Server Monitor|5': { mc: { m:'POST', ep:'https://www.site24x7.com/app/api/upgrade_profile' },
                        ex: [{ m:'GET', ep:'/app/api/short/server/upgrade_profile_types' },
                             { m:'GET', ep:'/app/api/upgrade_profiles/FULLSTACK_AGENT' }] },

  // ── Plugin Monitor ─────────────────────────────────────────────────────────
  'Plugin Monitor|4':  { mc: { m:'GET', ep:'/app/api/plugin_configurations' },
                         ex: [{ m:'GET', ep:'/app/api/short/plugins' }] },
  'Plugin Monitor|10': { mc: { m:'PUT', ep:'/app/api/plugin_configurations' },
                         ex: [{ m:'GET', ep:'/app/api/short/plugins' }] },

  // ── Operations ─────────────────────────────────────────────────────────────
  'Operations|2': { mc: { m:'DELETE', ep:'/app/api/maintenance/15698000489363071' },
                    ex: [{ m:'GET',  ep:'/app/api/maintenance' },
                         { m:'GET',  ep:'/app/api/current_maintenance_list' }] },
  'Operations|9': { mc: { m:'GET',  ep:'/sp/api/short/statuspages' },
                    ex: [{ m:'GET',  ep:'/sp/api/statuspages/15698000418173443' },
                         { m:'GET',  ep:'/sp/api/statuspages/15698000418173443/summary_details' }] },

  // ── My Account ─────────────────────────────────────────────────────────────
  'My Account|1':  { mc: { m:'GET', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'https://www.site24x7.com/app/api/account_settings' },
                          { m:'PUT', ep:'/app/api/account_settings' }] },
  'My Account|4':  { mc: { m:'GET', ep:'/app/api/client_data/user' },
                     ex: [{ m:'GET', ep:'https://www.site24x7.com/app/api/client_data/user' }] },
  'My Account|5':  { mc: { m:'PUT', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'/app/api/account_settings' }] },
  'My Account|7':  { mc: { m:'PUT', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'/app/api/account_settings' },
                          { m:'GET', ep:'https://www.site24x7.com/app/api/account_settings' }] },
  'My Account|8':  { mc: { m:'PUT', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'/app/api/account_settings' }] },
  'My Account|9':  { mc: { m:'PUT', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'/app/api/account_settings' },
                          { m:'GET', ep:'/app/api/scheduled_reports' }] },
  'My Account|11': { mc: { m:'PUT', ep:'/app/api/webclient_language' },
                     ex: [{ m:'PUT', ep:'/app/api/webclient_language' }] },
  'My Account|14': { mc: { m:'PUT', ep:'/app/api/account_settings' },
                     ex: [{ m:'GET', ep:'/app/api/account_settings' },
                          { m:'GET', ep:'https://www.site24x7.com/app/api/account_settings' }] },

  // ── Report Settings ────────────────────────────────────────────────────────
  'Report Settings|0':  { mc: { m:'GET',    ep:'/app/api/scheduled_reports' },
                          ex: [{ m:'PUT',    ep:'/app/api/scheduled_reports/15698000342022005' },
                               { m:'POST',   ep:'/app/api/send_scheduled_reports' }] },
  'Report Settings|1':  { mc: { m:'PUT',    ep:'/app/api/scheduled_reports/activate/15698000342022005' },
                          ex: [{ m:'GET',    ep:'/app/api/scheduled_reports' },
                               { m:'POST',   ep:'/app/api/send_scheduled_reports' }] },
  'Report Settings|2':  { mc: { m:'POST',   ep:'/app/api/send_scheduled_reports' },
                          ex: [{ m:'GET',    ep:'/app/api/scheduled_reports' },
                               { m:'PUT',    ep:'/app/api/scheduled_reports/15698000342022005' }] },
  'Report Settings|3':  { mc: { m:'DELETE', ep:'/app/api/scheduled_reports/15698000342022005' },
                          ex: [{ m:'GET',    ep:'/app/api/scheduled_reports' }] },
  'Report Settings|4':  { mc: { m:'GET',    ep:'/app/api/customize_report' },
                          ex: [{ m:'PUT',    ep:'/app/api/customize_report' },
                               { m:'DELETE', ep:'/app/api/customize_report' }] },
  'Report Settings|6':  { mc: { m:'POST',   ep:'/app/api/sla_settings' },
                          ex: [{ m:'GET',    ep:'/app/api/sla_settings' },
                               { m:'GET',    ep:'/app/api/short/sla_settings/monitors/2' }] },
  'Report Settings|7':  { mc: { m:'GET',    ep:'/app/api/short/sla_settings/monitors/2' },
                          ex: [{ m:'GET',    ep:'/app/api/short/sla_settings/monitors/3' },
                               { m:'GET',    ep:'/app/api/sla_settings' }] },
  'Report Settings|10': { mc: { m:'GET',    ep:'/app/api/short/reports/custom_reports' },
                          ex: [{ m:'GET',    ep:'/app/api/reports/custom_reports' },
                               { m:'GET',    ep:'/app/api/scheduled_reports' }] },
  'Report Settings|14': { mc: { m:'PUT',    ep:'/app/api/customize_report' },
                          ex: [{ m:'GET',    ep:'/app/api/customize_report' },
                               { m:'GET',    ep:'/app/api/scheduled_reports' }] },

  // ── Share ──────────────────────────────────────────────────────────────────
  'Share|1':  { mc: { m:'GET',    ep:'/app/api/uptime_buttons' } },
  'Share|2':  { mc: { m:'POST',   ep:'/app/api/dashboard_views' },
                ex: [{ m:'GET',    ep:'/app/api/dashboards/15698000407685846' },
                     { m:'GET',    ep:'/app/api/dashboard_views' }] },
  'Share|3':  { mc: { m:'DELETE', ep:'/app/api/dashboard_views/15698000033393001' },
                ex: [{ m:'GET',    ep:'/app/api/dashboards/15698000407685846' },
                     { m:'GET',    ep:'/app/api/dashboard_views' }] },
  'Share|5':  { mc: { m:'POST',   ep:'/app/api/public_reports' },
                ex: [{ m:'GET',    ep:'/app/api/public_reports' },
                     { m:'PUT',    ep:'/app/api/public_reports/15698000325373001' }] },
  'Share|7':  { mc: { m:'PUT',    ep:'/app/api/dashboard_views/15698000033393001' },
                ex: [{ m:'GET',    ep:'/app/api/dashboards/15698000407685846' },
                     { m:'GET',    ep:'/app/api/dashboard_views' }] },
  'Share|8':  { mc: { m:'GET',    ep:'/app/api/dashboards/15698000407685846' },
                ex: [{ m:'GET',    ep:'/app/api/dashboard_views' }] },
  'Share|9':  { mc: { m:'DELETE', ep:'/app/api/public_reports/15698000325373001' },
                ex: [{ m:'GET',    ep:'/app/api/public_reports' }] },
  'Share|12': { mc: { m:'GET',    ep:'/app/api/dashboards/15698000407685846' },
                ex: [{ m:'GET',    ep:'/app/api/dashboard_views' },
                     { m:'GET',    ep:'/app/api/short/dashboards/favourites' }] },
  'Share|14': { mc: { m:'GET',    ep:'https://www.site24x7.com/app/api/business_hours' },
                ex: [{ m:'GET',    ep:'/app/api/short/business_hours' }] },

  // ── Milestones ─────────────────────────────────────────────────────────────
  'Milestones|0':  { mc: { m:'PUT', ep:'/app/api/milestone/default_marker' } },
  'Milestones|9':  { mc: { m:'GET', ep:'/app/api/monitor_groups' },
                     ex: [{ m:'GET', ep:'/app/api/monitor_groups?subgroup_required=true' },
                          { m:'GET', ep:'/app/api/short/monitor_groups' }] },
  'Milestones|13': { mc: { m:'PUT', ep:'/app/api/milestone/default_marker' } },

  // ── Third-Party Integrations ───────────────────────────────────────────────
  'Third-Party Integrations|0': { mc: { m:'POST', ep:'/app/api/integration/pager_duty' },
                                   ex: [{ m:'GET', ep:'/app/api/integration/thirdparty_status/28' }] },

  // ── Tags ───────────────────────────────────────────────────────────────────
  'Tags|0':  { mc: { m:'GET',    ep:'/app/api/tags/monitors' },
               ex: [{ m:'POST',   ep:'/app/api/tags' },
                    { m:'GET',    ep:'/app/api/tags' }] },
  'Tags|4':  { mc: { m:'GET',    ep:'/app/api/tags/monitors' },
               ex: [{ m:'GET',    ep:'/app/api/associated_tags' },
                    { m:'GET',    ep:'/app/api/template_associated_monitors' }] },
  'Tags|7':  { mc: { m:'POST',   ep:'/app/api/tags' },
               ex: [{ m:'GET',    ep:'/app/api/tags' },
                    { m:'GET',    ep:'/app/api/short/tags' }] },
  'Tags|12': { mc: { m:'GET',    ep:'/app/api/client_data/user' },
               ex: [{ m:'GET',    ep:'/app/api/client_data/account' },
                    { m:'GET',    ep:'/app/api/tags' }] },

  // ── Downloads ──────────────────────────────────────────────────────────────
  'Downloads|3':  { mc: { m:'PUT',  ep:'/app/api/download_count' },
                    ex: [{ m:'POST', ep:'/app/api/apminsight/download/JAVA' },
                         { m:'POST', ep:'/app/api/apminsight/download/DOTNET' },
                         { m:'POST', ep:'/app/api/apminsight/download/RUBY' }] },
  'Downloads|5':  { mc: { m:'PUT',  ep:'/app/api/download_count' },
                    ex: [{ m:'POST', ep:'/app/api/apminsight/download/JAVA' },
                         { m:'POST', ep:'/app/api/apminsight/download/DOTNET' }] },
  'Downloads|11': { mc: { m:'POST', ep:'/app/api/apminsight/download/JAVA' },
                    ex: [{ m:'GET',  ep:'https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip' }] },
  'Downloads|14': { mc: { m:'PUT',  ep:'/app/api/download_count' },
                    ex: [{ m:'POST', ep:'/app/api/apminsight/download/JAVA' },
                         { m:'POST', ep:'/app/api/apminsight/download/DOTNET' },
                         { m:'POST', ep:'/app/api/apminsight/download/RUBY' }] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Question bank (225 questions across 15 feature sections)
// ─────────────────────────────────────────────────────────────────────────────
const questions = {
  'Inventory': [
    'List all monitors in the account',
    'Show me all monitor groups',
    'How do I import monitors in bulk?',
    'What API retrieves the license usage for the account?',
    'How do I check monitor dependencies?',
    'List all credential profiles stored in the account',
    'Which API shows network discovery results?',
    'How do I get the list of network pollers?',
    'What field holds the AWS account ID for an integration?',
    'Show me all device templates available',
    'How do I retrieve threshold profiles?',
    'List APIs related to network polling schedules',
    'What endpoint returns dynamic filter definitions?',
    'How do I check the status of a poller?',
    'Which API lists all server templates in Inventory?',
  ],
  'User & Alert Management': [
    'List all users in the account',
    'How do I create a new user role?',
    'Show me all user groups',
    'What API manages on-call schedules?',
    'How do I update an alert category?',
    'List all attribute groups for monitors',
    'Which endpoint fetches attribute definitions and values?',
    'How do I view the change tracker log?',
    "What field holds a user's role permissions?",
    'List APIs related to user group management',
    'How do I check which alert categories exist?',
    'What endpoint updates an existing attribute group?',
    'Show me all on-call schedules configured',
    'Which API is used for role-based access control?',
    'How do I retrieve a lightweight list of attribute groups?',
  ],
  'Configuration Profiles': [
    'Which API creates a new Location Profile?',
    'How do I set up a Threshold and Availability profile?',
    'What endpoint creates a Notification Profile?',
    'List all Business Hours profiles',
    'How do I create an Email Template?',
    'Which API configures an OAuth Provider?',
    'How do I generate a Web Token?',
    'What endpoint creates an APM Agent Configuration profile?',
    'How do I set up APM Business Transaction Rules?',
    'Which API stores Credential Profiles?',
    'How do I configure a Metric Profile?',
    'What endpoint manages Mobile Application Profiles?',
    'How do I enable Anomaly Settings?',
    'Which API handles Auto Upgrade Profiles?',
    'How do I create a Custom Report?',
  ],
  'Automations': [
    'How do I create a new IT Automation?',
    'List all configured IT Automations',
    'What API retrieves IT Automation execution logs?',
    'How do I check Circuits integration status?',
    'Which endpoint creates a new circuit monitor?',
    'What API connects Automations to Qntrl?',
    'How do I list files available for automation scripts?',
    'Which API retrieves the alarm report for a specific monitor?',
    'What endpoint fetches outage reports?',
    'How do I check SLO (Service Level Objective) settings?',
    'List all maintenance windows configured',
    'Which API shows monitor status for an IT Automation?',
    'How do I retrieve location templates used by automations?',
    'What endpoint lists favourite dashboards?',
    'How do I tag a monitor used in an automation?',
  ],
  'Zia Settings': [
    'Show me all Zia AI workflow APIs',
    'How do I get AI-generated recommendations?',
    'What API lists AI data collections?',
    'Which endpoint retrieves a specific AI workflow by name?',
    'How do I fetch the list of monitors available to the AI module?',
    'What API retrieves AI task definitions?',
    'How do I check the status of the alarms assistant AI workflow?',
    'Which endpoint configures the underlying AI/bot model?',
    'How do I retrieve the Kubernetes AI assistant workflow?',
    'What API powers the APM AI assistant?',
    'How do I list curated AI monitor collections?',
    'Which endpoint handles the problems assistant workflow?',
    'What field identifies a specific AI workflow?',
    'How do I check AI recommendation status?',
    'List all AI-related endpoints in Zia Settings',
  ],
  'Server Monitor': [
    'List all server templates configured',
    'How do I create a new Resource Profile?',
    'Which monitors are associated with a given Resource Profile?',
    'What API manages Server Monitor Setting Profiles?',
    'How do I check available agent upgrade versions?',
    'Which endpoint creates an Upgrade Profile for server agents?',
    'What API retrieves APM Auto Profiler Rules?',
    'How do I disable a specific Auto Profiler Rule?',
    'List notification profiles used for server monitors',
    'What field holds the threshold values for a server profile?',
    'How do I check which features are available for server monitoring?',
    'Which API lists monitors using a specific server template?',
    'How do I retrieve threshold profiles for Server Monitor?',
    'What endpoint shows monitor resource support details?',
    'How do I view monitor groups tied to server monitoring?',
  ],
  'Plugin Monitor': [
    'How do I enable plugin auto-discovery?',
    'What API toggles the plugin auto-discovery setting?',
    'List all plugin templates registered on the account',
    "Which endpoint fetches a specific plugin template's details?",
    'How do I check the current plugin configuration?',
    'What field shows the number of attributes a plugin template reports?',
    'How do I update the plugin monitor settings?',
    'Which API retrieves the iNodeMon plugin template?',
    'What endpoint is used to view a Redis plugin template?',
    'How do I list all registered plugin monitors?',
    'What method is used to enable auto-discovery for plugins?',
    'Which API shows plugin template version numbers?',
    'How do I check if a plugin template exists by ID?',
    'What endpoint manages plugin monitor configuration?',
    'List APIs related to custom plugin scripts',
  ],
  'Operations': [
    'How do I create a scheduled maintenance window?',
    'List all currently active maintenance windows',
    'Which API deletes a specific maintenance window?',
    'How do I share a maintenance schedule as an iCal link?',
    'What endpoint retrieves the alert log search results?',
    'How do I search alert logs by date range?',
    'Which API fetches a log report for a specific monitor?',
    'What field shows the data collection type for log reports?',
    'How do I schedule an IT Automation under Operations?',
    'List all status pages configured under StatusIQ',
    'How do I create a new incident on a status page?',
    'Which API checks the license access for a status page module?',
    'What endpoint retrieves metrics data for a status page component?',
    'How do I view resolved incidents on a status page?',
    'What API lists saved search queries for alert logs?',
  ],
  'My Account': [
    'How do I update my account settings?',
    'Which API retrieves the current account-level settings?',
    'How do I change my personal status message?',
    'What endpoint updates the web client language?',
    "Which API fetches a specific user's profile details?",
    'How do I change the report time zone in My Account?',
    'What field controls the snackbar notification count?',
    'Which API updates the default landing page after login?',
    'How do I enable two-factor authentication for sensitive operations?',
    'What endpoint changes the hour format for reports?',
    'How do I update my notification preferences?',
    'Which API retrieves organization-level language settings?',
    "What field holds the user's allowed monitor groups?",
    'How do I check which plan my account is subscribed to?',
    'What endpoint updates account-level industry information?',
  ],
  'Report Settings': [
    'How do I create a new scheduled report?',
    'Which API activates a previously created scheduled report?',
    'What endpoint sends a scheduled report immediately?',
    'How do I delete a scheduled report?',
    'Which API customizes the report logo and branding?',
    'What field controls the decimal precision for availability percentage?',
    'How do I create an SLA setting for a monitor?',
    'Which API retrieves SLA settings for a specific monitor?',
    'What endpoint deletes an existing SLA configuration?',
    'How do I list business hours used in report scheduling?',
    'Which API retrieves custom report templates for a scheduled report?',
    'What field defines the SLA goal percentage?',
    'How do I check which monitor groups are available for a report?',
    'Which API lists tags usable in report filters?',
    'What endpoint updates report customization settings like sender email?',
  ],
  'Share': [
    'How do I create an Uptime Button?',
    'Which API lists existing Uptime Buttons?',
    'What endpoint creates a new Operations Dashboard?',
    'How do I delete a specific Operations Dashboard?',
    'Which API retrieves the list of public reports?',
    'How do I publish a new Public Report?',
    'What field controls which monitors are shown on an Uptime Button?',
    'Which API updates an existing Operations Dashboard?',
    'How do I get the embed code for a shared dashboard?',
    'What endpoint deletes a Public Report?',
    'Which API lists monitor groups available for sharing?',
    'How do I check which plugins are available when publishing a report?',
    'What field holds the permalink for a shared dashboard?',
    'Which API retrieves custom reports available for public sharing?',
    'How do I list business hours available when publishing a report?',
  ],
  'Milestones': [
    'How do I create a new milestone?',
    'Which API updates the default milestone marker setting?',
    'What endpoint loads monitor groups for milestone association?',
    'How do I check which monitor a milestone is tied to?',
    'What field controls milestone marker visibility?',
    "Which API fetches the current user's profile for the Milestones page?",
    'How do I retrieve account-level configuration before viewing milestones?',
    'What endpoint loads global settings required by the Milestones module?',
    'Which API manages milestone marker behavior (Monitor/Group/Global)?',
    'How do I list milestones associated with a specific monitor group?',
    'What field holds the milestone name?',
    'Which API checks subscription details before rendering milestones?',
    'How do I fetch demo mode flags for the Milestones page?',
    'What endpoint is used to mark a new deployment milestone?',
    'Which API loads dashboard preferences for the Milestones view?',
  ],
  'Third-Party Integrations': [
    'How do I set up PagerDuty alerts?',
    'Which API creates a Slack integration?',
    'How do I configure a webhook integration?',
    'What endpoint creates a ServiceNow integration?',
    'Which API retrieves ServiceNow CMDB monitor type mappings?',
    'How do I check the ServiceNow CMDB sync status?',
    'What API integrates with Opsgenie?',
    'How do I connect Site24x7 to Microsoft Teams or Discord?',
    'Which API sets up a Zoho Cliq integration?',
    'How do I configure Splunk On-Call as an integration?',
    'What endpoint lists all supported third-party integration providers?',
    'Which API connects to Amazon EventBridge?',
    'How do I set up an Azure OpenAI integration?',
    'What field maps ServiceNow CMDB attributes to Site24x7 fields?',
    'Which API configures a Jira Service Management integration?',
  ],
  'Tags': [
    'How do I add a tag to a monitor?',
    'List all tags configured in the account',
    'Which API creates a new tag?',
    "What field holds the tag's color?",
    'How do I check which monitors are associated with a specific tag?',
    'What endpoint retrieves saved table preferences for the Tags view?',
    'Which API logs a change-tracking event for tag actions?',
    'How do I delete an existing tag?',
    "What field distinguishes a tag's name from its value?",
    'Which API records when a tag is applied to a monitor?',
    'How do I list tags filtered by tag type?',
    'What endpoint loads account context before rendering the Tags page?',
    'Which API checks session/user context for the Tags module?',
    'How do I retrieve the column order saved for the Tags table?',
    'What status code do tag creation requests return in the demo account?',
  ],
  'Downloads': [
    'How do I download the Java APM agent?',
    'Which API records a .NET APM agent download event?',
    'What endpoint downloads the Ruby APM monitoring agent?',
    'How do I check how many times an agent has been downloaded?',
    'Which API initiates the Java APM agent download workflow?',
    'What field tracks the download counter for an agent?',
    'How do I get the direct download link for the .NET APM agent installer?',
    'Which API fetches account context before showing downloads?',
    'What endpoint loads dashboard preferences for the Downloads page?',
    'How do I download the Ruby APM agent gem package?',
    'Which API checks user context before rendering the Downloads module?',
    'What status code is returned when recording a Java agent download?',
    'How do I find the static download URL for the .NET agent MSI?',
    'Which API loads bootstrap/demo metadata for the Downloads page?',
    'What endpoint is used to track agent download counts account-wide?',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate the guide
// ─────────────────────────────────────────────────────────────────────────────
let doc = '# Site24x7 \u2014 Labeling Reference\n\n';
doc += 'For each question: Mark Correct on the \u2705 path. Add to Dataset for every \uD83D\uDCC1 path.\n\n---\n\n';
let flagged = [];

Object.entries(questions).forEach(([feature, qs]) => {
  doc += `## ${feature}\n\n`;

  qs.forEach((q, idx) => {
    const key = `${feature}|${idx}`;
    doc += `### Q${idx + 1}. ${q}\n\n`;

    const override = OVERRIDES[key];
    const { scored, subjects, prefM } = search(q, feature);

    let mcEntry;

    if (override && override.mc) {
      const found = findApi(override.mc.m, override.mc.ep);
      if (found) {
        mcEntry = { api: found };
      } else {
        mcEntry = { api: { method: override.mc.m, endpoint: override.mc.ep, subFeature: '', description: '' } };
        flagged.push({ q, feature, reason: 'override not found in dataset', ep: override.mc.ep });
      }
    } else {
      if (!scored.length) {
        doc += '> \u26A0\uFE0F No results found \u2014 skip this question.\n\n---\n\n';
        flagged.push({ q, feature, reason: 'no results' });
        return;
      }
      mcEntry = pickMarkCorrect(scored, subjects, prefM);
    }

    doc += `\u2705 **Mark Correct:** \`${mcEntry.api.method} ${mcEntry.api.endpoint}\`\n\n`;

    // Build dataset list
    const correctKey = dedupKey(mcEntry.api);
    const seen = new Set([correctKey]);
    const dsItems = [];

    // From search results
    for (const r of scored) {
      if (dsItems.length >= 5) break;
      const k = dedupKey(r.api);
      if (seen.has(k)) continue;
      if (!pathRelevant(r.api, subjects)) continue;
      seen.add(k);
      dsItems.push(r.api);
    }

    // From override extras
    if (override && override.ex) {
      for (const extra of override.ex) {
        if (dsItems.length >= 5) break;
        const k = extra.m + '|' + normEp(extra.ep);
        if (seen.has(k)) continue;
        seen.add(k);
        const found = findApi(extra.m, extra.ep);
        dsItems.push(found || { method: extra.m, endpoint: extra.ep });
      }
    }

    if (dsItems.length > 0) {
      doc += '\uD83D\uDCC1 **Add to Dataset:**\n';
      dsItems.slice(0, 5).forEach(a => {
        doc += `- \`${a.method} ${a.endpoint}\`\n`;
      });
      doc += '\n';
    }

    doc += '---\n\n';
  });
});

if (flagged.length) {
  doc += `## \u26A0\uFE0F Flagged Items (${flagged.length})\n\n`;
  flagged.forEach((f, i) => {
    doc += `${i + 1}. **[${f.feature}]** ${f.q} \u2014 ${f.reason}`;
    if (f.ep) doc += ` \u2192 \`${f.ep}\``;
    doc += '\n';
  });
}

fs.writeFileSync('labeling_guide_v2.md', doc, 'utf8');
console.log(`Done! Flagged: ${flagged.length}`);
console.log('labeling_guide_v2.md written.');