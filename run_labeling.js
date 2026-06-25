const fs = require('fs');

const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const apis = data.apis;

// ── Stopwords ──
const STOPWORDS = new Set(['a','an','the','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should','may','might',
  'shall','can','need','to','in','on','at','by','for','with','about','against',
  'between','into','through','during','before','after','above','below','from','up',
  'down','out','off','over','under','again','further','then','once','here','there',
  'when','where','why','how','all','both','each','few','more','most','other','some',
  'such','no','nor','not','only','own','same','so','than','too','very','just',
  'because','as','until','while','of','and','or','that','this','these','those',
  'it','its','what','which','who','whom','me','my','i','give','tell','please','you']);

// Additional words that are too generic to be useful for endpoint matching
const GENERIC = new Set(['list','show','retrieve','check','view','fetch','create',
  'delete','update','configure','set','enable','disable','manage','find','get',
  'available','existing','specific','currently','previously','account','new',
  'related','holds','field','endpoint','api','use','used','using','returns','return',
  'status','result','results','report','reports','log','logs','data','info',
  'configure','configuration','settings','setting']);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9_\/\-\.]/g,' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// Extract subject terms — what the question is actually ABOUT
function subjectTerms(question) {
  return tokenize(question).filter(t => t.length > 2 && !GENERIC.has(t));
}

function scoreResult(api, tokens) {
  let s = 0;
  tokens.forEach(tok => {
    if (api.endpoint.toLowerCase().includes(tok)) s += 12;
    if (api.subFeature.toLowerCase().includes(tok)) s += 10;
    if (api.sheet.toLowerCase().includes(tok)) s += 8;
    if (api.description.toLowerCase().includes(tok)) s += 6;
    if (api.responseFields && api.responseFields.some(f => f.toLowerCase().includes(tok))) s += 7;
    if (api.requestFields && api.requestFields.some(f => f.toLowerCase().includes(tok))) s += 5;
    if (api.summaryText && api.summaryText.toLowerCase().includes(tok)) s += 4;
    if (api.searchText && api.searchText.includes(tok)) s += 1;
  });
  const q = tokens.join(' ');
  if (api.subFeature.toLowerCase().includes(q)) s += 20;
  if (api.description.toLowerCase().includes(q)) s += 15;
  if (api.endpoint.toLowerCase().includes(q)) s += 18;
  return s;
}

// Semantic relevance: how well does this endpoint match the question's subject?
function semanticRelevance(api, subjects) {
  if (!subjects.length) return 0;
  const ep = api.endpoint.toLowerCase();
  const sf = api.subFeature.toLowerCase();
  const desc = api.description.toLowerCase();
  let score = 0;
  subjects.forEach(s => {
    if (ep.includes(s)) score += 6;   // endpoint path is strongest signal
    if (sf.includes(s)) score += 4;   // sub-feature name
    if (desc.includes(s)) score += 2; // description
  });
  return score;
}

function search(question) {
  const tokens = tokenize(question);
  const subjects = subjectTerms(question);
  if (!tokens.length) return [];

  return apis
    .map(api => ({
      api,
      rawScore: scoreResult(api, tokens),
      semScore: semanticRelevance(api, subjects)
    }))
    .filter(r => r.rawScore > 0)
    .sort((a, b) => {
      // Primary sort: semantic relevance (subject terms in endpoint/subFeature)
      // Secondary sort: raw keyword score
      const semDiff = b.semScore - a.semScore;
      if (Math.abs(semDiff) > 3) return semDiff; // clear semantic winner
      return b.rawScore - a.rawScore;             // otherwise use raw score
    });
}

// ── All 225 questions ──
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
    'What field holds a user\'s role permissions?',
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
    'Which endpoint fetches a specific plugin template\'s details?',
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
    'Which API fetches a specific user\'s profile details?',
    'How do I change the report time zone in My Account?',
    'What field controls the snackbar notification count?',
    'Which API updates the default landing page after login?',
    'How do I enable two-factor authentication for sensitive operations?',
    'What endpoint changes the hour format for reports?',
    'How do I update my notification preferences?',
    'Which API retrieves organization-level language settings?',
    'What field holds the user\'s allowed monitor groups?',
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
    'Which API fetches the current user\'s profile for the Milestones page?',
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
    'What field holds the tag\'s color?',
    'How do I check which monitors are associated with a specific tag?',
    'What endpoint retrieves saved table preferences for the Tags view?',
    'Which API logs a change-tracking event for tag actions?',
    'How do I delete an existing tag?',
    'What field distinguishes a tag\'s name from its value?',
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

// ── Generate the guide ──
let doc = '# Site24x7 — Labeling Reference\n\n';
doc += 'For each question: in the browser, type the question exactly, then:\n';
doc += '- Click **Mark Correct** on the ✅ result\n';
doc += '- Click **Add to Dataset** on every 📁 result\n';
doc += '- If marked ⚠️, verify manually in the browser before deciding\n\n---\n\n';

let flagged = [];

Object.entries(questions).forEach(([feature, qs]) => {
  doc += `## ${feature}\n\n`;

  qs.forEach((q, idx) => {
    const results = search(q);
    const maxScore = results.length ? results[0].rawScore : 0;

    doc += `### Q${idx + 1}. ${q}\n\n`;

    if (!results.length || maxScore < 6) {
      doc += `> ⚠️ No results found — skip this question.\n\n---\n\n`;
      flagged.push({ q, feature, reason: 'no results' });
      return;
    }

    const top = results[0];
    const lowConf = top.semScore < 4 && maxScore < 25;

    doc += `✅ **Mark Correct:** \`${top.api.method} ${top.api.endpoint}\`\n`;
    doc += `> ${top.api.subFeature} — *"${top.api.description.substring(0, 120)}${top.api.description.length > 120 ? '...' : ''}"*\n\n`;

    if (lowConf) {
      doc += `> ⚠️ Low confidence — verify this in the browser before clicking.\n\n`;
      flagged.push({ q, feature, reason: 'low confidence', ep: top.api.endpoint });
    }

    // Dataset candidates: high semantic OR raw score, different endpoint, not obviously wrong
    const datasetCandidates = results.slice(1, 8).filter(r =>
      r.api.endpoint !== top.api.endpoint &&
      (r.rawScore >= maxScore * 0.6 || r.semScore >= top.semScore * 0.7) &&
      r.rawScore > 5
    );

    if (datasetCandidates.length) {
      doc += `📁 **Add to Dataset:**\n`;
      datasetCandidates.slice(0, 4).forEach(r => {
        doc += `- \`${r.api.method} ${r.api.endpoint}\`  —  ${r.api.subFeature}\n`;
      });
      doc += '\n';
    }

    doc += '---\n\n';
  });
});

// Flagged summary at end
if (flagged.length) {
  doc += `## ⚠️ Flagged Questions (${flagged.length})\n\n`;
  doc += 'These need manual verification in the browser:\n\n';
  flagged.forEach((f, i) => {
    doc += `${i + 1}. **[${f.feature}]** ${f.q}`;
    if (f.ep) doc += ` → *top result was \`${f.ep}\`*`;
    doc += '\n';
  });
}

fs.writeFileSync('labeling_guide.md', doc, 'utf8');
console.log(`Done! Flagged: ${flagged.length} / 225`);
console.log('labeling_guide.md written.');
