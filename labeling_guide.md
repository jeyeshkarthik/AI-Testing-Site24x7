# Site24x7 — Labeling Reference

For each question: Mark Correct on the ✅ path. Add to Dataset for every 📁 path.

---

## Inventory

### Q1. List all monitors in the account

✅ **Mark Correct:** `GET /app/api/account_settings`

📁 **Add to Dataset:**
- `GET /app/api/genai/module/monitorlist`
- `GET /app/api/resource_profile/associated_monitors`
- `GET /app/api/setting_profile/associated_monitors`
- `GET /app/api/short/all/monitors`

---

### Q2. Show me all monitor groups

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/monitor_groups`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/monitor_groups`

---

### Q3. How do I import monitors in bulk?

✅ **Mark Correct:** `PUT /app/api/monitors/import`

📁 **Add to Dataset:**
- `GET /app/api/monitors/import/continuous_import`
- `GET /app/api/monitors/import/status`

---

### Q4. What API retrieves the license usage for the account?

✅ **Mark Correct:** `GET /app/api/license_usage`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/license_usage`
- `GET /app/api/account_settings`
- `PUT /app/api/account_settings`
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`

---

### Q5. How do I check monitor dependencies?

✅ **Mark Correct:** `GET /app/api/short/monitors_resource_supported`

📁 **Add to Dataset:**
- `GET /app/api/monitors/details_page/base/{id}`
- `GET /app/api/monitor_groups`
- `GET /app/api/short/monitors_support/6001`
- `GET /app/api/short/monitor_groups`
- `GET /app/api/monitors/status/count`

---

### Q6. List all credential profiles stored in the account

✅ **Mark Correct:** `GET /app/api/credential_profiles`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/credential_profiles`
- `GET /app/api/short/credential_list`
- `GET /app/api/short/location_profiles`
- `POST https://www.site24x7.com/app/api/credential_profile`

---

### Q7. Which API shows network discovery results?

✅ **Mark Correct:** `GET /app/api/network/discovery_rules`

📁 **Add to Dataset:**
- `GET /app/api/network/pollers`

---

### Q8. How do I get the list of network pollers?

✅ **Mark Correct:** `GET /app/api/network/pollers`

---

### Q9. What field holds the AWS account ID for an integration?

✅ **Mark Correct:** `GET /app/api/aws/account_id/{aws_account_ref}`

📁 **Add to Dataset:**
- `POST /app/api/integration/event_bridge`
- `GET /app/api/aws/add/event_bridge/{user_id}`
- `GET /app/api/aws/external_id`

---

### Q10. Show me all device templates available

✅ **Mark Correct:** `GET /app/api/short/device/templates`

---

### Q11. How do I retrieve threshold profiles?

✅ **Mark Correct:** `GET /app/api/threshold_profiles`

📁 **Add to Dataset:**
- `POST https://www.site24x7.com/app/api/threshold_profiles`
- `GET /app/api/short/threshold_profiles`
- `GET /app/api/short/threshold_profiles/{monitor_type}`
- `GET /app/api/short/threshold_profiles/SERVER`
- `GET https://www.site24x7.com/app/api/plugin/list_threshold_profiles/PLUGIN`

---

### Q12. List APIs related to network polling schedules

✅ **Mark Correct:** `GET /app/api/short/network_schedules/{schedule_type}`

📁 **Add to Dataset:**
- `GET /app/api/network/pollers`

---

### Q13. What endpoint returns dynamic filter definitions?

✅ **Mark Correct:** `POST /app/api/dynamic_monitors/grouping_filters/{monitor_type}/{filter_id}`

📁 **Add to Dataset:**
- `GET /app/api/filters`
- `POST /app/api/filters`

---

### Q14. How do I check the status of a poller?

✅ **Mark Correct:** `GET /app/api/network/pollers`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443/license/check_module_access`
- `GET /sp/api/statuspages/15698000418173443/summary_details`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/monitors/status/count`
- `GET /app/api/short/current_status`

---

### Q15. Which API lists all server templates in Inventory?

✅ **Mark Correct:** `GET /app/api/short/server_templates`

📁 **Add to Dataset:**
- `GET /app/api/server_templates`
- `GET /app/api/short/device/templates`

---

## User & Alert Management

### Q1. List all users in the account

✅ **Mark Correct:** `GET /app/api/short/users_list`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`
- `PUT /app/api/account_settings`

---

### Q2. How do I create a new user role?

✅ **Mark Correct:** `GET /app/api/short/custom_roles`

📁 **Add to Dataset:**
- `GET /app/api/short/users_list`
- `GET /app/api/short/user_groups`
- `DELETE /app/api/users/{id}`
- `GET /app/api/client_data/user`

---

### Q3. Show me all user groups

✅ **Mark Correct:** `GET /app/api/short/user_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/users_list`

---

### Q4. What API manages on-call schedules?

✅ **Mark Correct:** `GET /app/api/on_call_schedules`

📁 **Add to Dataset:**
- `GET /app/api/short/on_call_schedules`
- `PUT /app/api/on_call_schedules/{id}`
- `GET /app/api/short/network_schedules/{schedule_type}`

---

### Q5. How do I update an alert category?

✅ **Mark Correct:** `PUT /app/api/alarms_category/{id}`

📁 **Add to Dataset:**
- `GET /app/api/alarms_category`
- `GET /app/api/applog/alerts`

---

### Q6. List all attribute groups for monitors

✅ **Mark Correct:** `GET /app/api/attribute_groups`

📁 **Add to Dataset:**
- `PUT /app/api/attribute_groups/{id}`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/attribute_groups`
- `GET /app/api/short/attribute_groups`

---

### Q7. Which endpoint fetches attribute definitions and values?

✅ **Mark Correct:** `GET /app/api/attribute_details`

---

### Q8. How do I view the change tracker log?

✅ **Mark Correct:** `GET /app/api/applog/logtype_views`

📁 **Add to Dataset:**
- `PUT /app/api/tracker`

---

### Q9. What field holds a user's role permissions?

✅ **Mark Correct:** `GET /app/api/short/custom_roles`

📁 **Add to Dataset:**
- `GET /app/api/short/users_list`
- `GET /app/api/short/user_groups`
- `DELETE /app/api/users/{id}`
- `GET /app/api/client_data/user`
- `GET /app/api/client_data/user`

---

### Q10. List APIs related to user group management

✅ **Mark Correct:** `GET /app/api/short/user_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/users_list`
- `GET /app/api/attribute_groups`
- `PUT /app/api/attribute_groups/{id}`
- `DELETE /app/api/users/{id}`

---

### Q11. How do I check which alert categories exist?

✅ **Mark Correct:** `GET /app/api/applog/alerts`

📁 **Add to Dataset:**
- `PUT /app/api/alarms_category/{id}`
- `GET /app/api/alarms_category`

---

### Q12. What endpoint updates an existing attribute group?

✅ **Mark Correct:** `PUT /app/api/attribute_groups/{id}`

📁 **Add to Dataset:**
- `GET /app/api/attribute_groups`
- `GET /app/api/short/attribute_groups`
- `GET /app/api/short/attribute_groups`

---

### Q13. Show me all on-call schedules configured

✅ **Mark Correct:** `GET /app/api/on_call_schedules`

📁 **Add to Dataset:**
- `GET /app/api/short/on_call_schedules`
- `PUT /app/api/on_call_schedules/{id}`

---

### Q14. Which API is used for role-based access control?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/license/check_module_access`

📁 **Add to Dataset:**
- `GET /app/api/integration/slack/15698000442055001`
- `GET /app/api/integration/thirdparty_status/28`
- `GET /app/api/integration/thirdparty_status/35`
- `GET /app/api/integration/thirdparty_status/36`
- `GET /app/api/location_template`

---

### Q15. How do I retrieve a lightweight list of attribute groups?

✅ **Mark Correct:** `GET /app/api/attribute_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/attribute_groups`
- `PUT /app/api/attribute_groups/{id}`
- `GET /app/api/short/attribute_groups`

---

## Configuration Profiles

### Q1. Which API creates a new Location Profile?

✅ **Mark Correct:** `POST https://www.site24x7.com/app/api/location_profiles`

📁 **Add to Dataset:**
- `GET /app/api/location_profiles`
- `GET /app/api/location_profiles/{location_profile_id}`
- `DELETE https://www.site24x7.com/app/api/location_profiles/{id}`
- `GET /app/api/short/location_profiles`

---

### Q2. How do I set up a Threshold and Availability profile?

✅ **Mark Correct:** `POST https://www.site24x7.com/app/api/threshold_profiles`

📁 **Add to Dataset:**
- `PUT https://www.site24x7.com/app/api/threshold_profiles/{id}`
- `GET https://www.site24x7.com/app/api/threshold_profiles/{id}`
- `GET /app/api/short/threshold_profiles`
- `GET /app/api/short/threshold_profiles/{monitor_type}`
- `PUT /app/api/setting_profile/{id}`

---

### Q3. What endpoint creates a Notification Profile?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/notification_profiles`

📁 **Add to Dataset:**
- `PUT https://www.site24x7.com/app/api/notification_profiles/{id}`
- `DELETE https://www.site24x7.com/app/api/notification_profiles/{id}`
- `GET /app/api/short/notification_profiles`
- `GET /app/api/short/notification_profiles`

---

### Q4. List all Business Hours profiles

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/business_hours`

📁 **Add to Dataset:**
- `PUT https://www.site24x7.com/app/api/business_hours/{id}`
- `DELETE https://www.site24x7.com/app/api/business_hours/{id}`
- `GET https://www.site24x7.com/app/api/short/apminsight/business_txn_config_profiles`
- `GET https://www.site24x7.com/app/api/notification_profiles`

---

### Q5. How do I create an Email Template?

✅ **Mark Correct:** `POST https://www.site24x7.com/app/api/email_templates`

📁 **Add to Dataset:**
- `DELETE https://www.site24x7.com/app/api/email_templates/{id}`
- `PUT https://www.site24x7.com/app/api/email_templates/{id}`

---

### Q6. Which API configures an OAuth Provider?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/oauth2_providers`

📁 **Add to Dataset:**
- `DELETE https://www.site24x7.com/app/api/oauth2_providers/{id}`
- `GET /app/api/oauth2_providers`
- `GET /app/api/short/oauth2_providers`

---

### Q7. How do I generate a Web Token?

✅ **Mark Correct:** `POST https://www.site24x7.com/app/api/test_jwt`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/jwt/{id}`
- `GET https://www.site24x7.com/app/api/preferences/table/8`
- `GET https://www.site24x7.com/app/api/short/jwt`
- `PUT /app/api/webclient_language`
- `PUT /app/api/webclient_language`

---

### Q8. What endpoint creates an APM Agent Configuration profile?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA`

📁 **Add to Dataset:**
- `POST https://www.site24x7.com/app/api/apminsight/agent_config_profile`
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/PYTHON`
- `PUT https://www.site24x7.com/app/api/apminsight/agent_config_profile/{id}`
- `GET https://www.site24x7.com/app/api/short/apminsight/agent_config_profiles`
- `DELETE https://www.site24x7.com/app/api/apminsight/agent_config_profile/{id}`

---

### Q9. How do I set up APM Business Transaction Rules?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/short/apminsight/business_txn_rules`

📁 **Add to Dataset:**
- `POST https://www.site24x7.com/app/api/apminsight/business_txn_rules`
- `DELETE https://www.site24x7.com/app/api/apminsight/business_txn_rules/{id}`
- `GET https://www.site24x7.com/app/api/apminsight/business_txn_rules/{id}`
- `PUT https://www.site24x7.com/app/api/apminsight/business_txn_rules/{id}`
- `PUT https://www.site24x7.com/app/api/apminsight/business_txn_config_profile/{id}`

---

### Q10. Which API stores Credential Profiles?

✅ **Mark Correct:** `GET /app/api/credential_profiles`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/credential_profiles`
- `POST https://www.site24x7.com/app/api/credential_profile`
- `GET /app/api/short/location_profiles`
- `GET /app/api/short/location_profiles/{monitor_type}`

---

### Q11. How do I configure a Metric Profile?

✅ **Mark Correct:** `POST https://www.site24x7.com/app/api/metric_profiles`

📁 **Add to Dataset:**
- `PUT https://www.site24x7.com/app/api/metric_profiles/{id}`
- `GET https://www.site24x7.com/app/api/metric_profiles/{id}`
- `GET https://www.site24x7.com/app/api/short/metric_profiles`
- `GET /app/api/short/metric_profiles`
- `GET /app/api/short/metric_profiles/{monitor_type}`

---

### Q12. What endpoint manages Mobile Application Profiles?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/mobilerbm/getAppBundleData`

📁 **Add to Dataset:**
- `DELETE https://www.site24x7.com/app/api/mobilerbm/delete_app/{id}`
- `PUT https://www.site24x7.com/app/api/mobilerbm/update_app_version`
- `GET https://www.site24x7.com/app/api/preferences/table/15`
- `GET /app/api/applog/log_profiles`

---

### Q13. How do I enable Anomaly Settings?

✅ **Mark Correct:** `PUT https://www.site24x7.com/app/api/anomaly_settings/{id}`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/anomaly_settings`

---

### Q14. Which API handles Auto Upgrade Profiles?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/upgrade_profiles/all`

📁 **Add to Dataset:**
- `GET /app/api/upgrade_profiles/FULLSTACK_AGENT`
- `GET https://www.site24x7.com/app/api/short/server/upgrade_profile_types`
- `POST https://www.site24x7.com/app/api/upgrade_profile`
- `DELETE https://www.site24x7.com/app/api/upgrade_profile/{id}`
- `GET https://www.site24x7.com/app/api/upgrade_profile/{id}`

---

### Q15. How do I create a Custom Report?

✅ **Mark Correct:** `DELETE /app/api/customize_report`

📁 **Add to Dataset:**
- `GET /app/api/short/reports/custom_reports`
- `POST https://www.site24x7.com/app/api/reports/custom_reports/preview`

---

## Automations

### Q1. How do I create a new IT Automation?

✅ **Mark Correct:** `GET /app/api/current_status/type/SCHEDULE_IT_AUTOMATION`

📁 **Add to Dataset:**
- `GET /app/api/it_automation/1/{id}`
- `GET /app/api/it_automation/2/{id}`
- `DELETE /app/api/it_automation/{id}`
- `PUT /app/api/it_automation/{id}`
- `GET /app/api/it_automation_types`

---

### Q2. List all configured IT Automations

✅ **Mark Correct:** `GET /app/api/it_automation/list`

📁 **Add to Dataset:**
- `GET /app/api/circuits/list`

---

### Q3. What API retrieves IT Automation execution logs?

✅ **Mark Correct:** `GET /app/api/it_automation/logs/{id}`

📁 **Add to Dataset:**
- `GET /app/api/it_automation/1/{id}`
- `GET /app/api/it_automation/2/{id}`
- `GET /app/api/it_automation_types`
- `GET /app/api/it_automation/settings`

---

### Q4. How do I check Circuits integration status?

✅ **Mark Correct:** `GET /app/api/circuits/integration_status`

📁 **Add to Dataset:**
- `GET /app/api/integration/thirdparty_status/28`
- `GET /app/api/integration/thirdparty_status/35`
- `GET /app/api/integration/thirdparty_status/36`
- `GET /app/api/integration/thirdparty_status/41`
- `GET /app/api/integration/snow_cmdb_status`

---

### Q5. Which endpoint creates a new circuit monitor?

✅ **Mark Correct:** `POST /app/api/circuits`

📁 **Add to Dataset:**
- `GET /app/api/monitor_groups`
- `POST /app/api/monitors`
- `POST /app/api/monitors`
- `GET /app/api/short/monitor_groups`
- `GET /app/api/short/monitors_resource_supported`

---

### Q6. What API connects Automations to Qntrl?

✅ **Mark Correct:** `GET /qntrl/_web/v2/site24x7_41343479/client_configurations`

📁 **Add to Dataset:**
- `GET /app/api/client_data/demo`
- `GET /app/api/monitors/details_page/base/{id}`
- `GET /app/api/client_data/user`
- `GET https://www.site24x7.com/app/api/client_data/user`
- `POST /app/api/integration/zia_azure`

---

### Q7. How do I list files available for automation scripts?

✅ **Mark Correct:** `GET /app/api/it_automation/list`

📁 **Add to Dataset:**
- `GET /app/api/file_list`
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET https://www.site24x7.com/app/api/plugin/list_threshold_profiles/PLUGIN`

---

### Q8. Which API retrieves the alarm report for a specific monitor?

✅ **Mark Correct:** `GET /app/api/reports/alarm/{id}`

📁 **Add to Dataset:**
- `GET /app/api/scheduled_reports`
- `GET /app/api/monitor_groups`
- `GET /app/api/short/forecast/monitors`
- `GET /app/api/short/monitor_groups_list`

---

### Q9. What endpoint fetches outage reports?

✅ **Mark Correct:** `PUT /app/api/reports/outage/{id}`

📁 **Add to Dataset:**
- `GET /app/api/short/reports/custom_reports`
- `GET /app/api/scheduled_reports`
- `GET /app/api/public_reports`
- `GET /app/api/reports/custom_reports`

---

### Q10. How do I check SLO (Service Level Objective) settings?

✅ **Mark Correct:** `GET /app/api/short/third_party_services`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/sla_settings`
- `POST /app/api/sla_settings`
- `DELETE /app/api/sla_settings/15698000493103037`

---

### Q11. List all maintenance windows configured

✅ **Mark Correct:** `GET /app/api/maintenance`

📁 **Add to Dataset:**
- `GET /app/api/current_maintenance_list`
- `GET /app/api/it_automation/list`

---

### Q12. Which API shows monitor status for an IT Automation?

✅ **Mark Correct:** `GET /app/api/it_automation/monitor/status_details/{id}`

📁 **Add to Dataset:**
- `GET /app/api/monitors/status/count`
- `GET /app/api/monitors/status/count`
- `GET /app/api/short/current_status`
- `GET /app/api/short/current_status`
- `GET /app/api/monitors/status/count`

---

### Q13. How do I retrieve location templates used by automations?

✅ **Mark Correct:** `GET /app/api/location_template`

📁 **Add to Dataset:**
- `GET /app/api/location_profiles`
- `GET /app/api/location_profiles/{location_profile_id}`

---

### Q14. What endpoint lists favourite dashboards?

✅ **Mark Correct:** `GET /app/api/short/dashboards/favourites`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/short/dashboards/favourites`

---

### Q15. How do I tag a monitor used in an automation?

✅ **Mark Correct:** `GET /app/api/it_automation/monitor/status_details/{id}`

📁 **Add to Dataset:**
- `GET /app/api/tags/monitors`
- `GET /app/api/monitors/details_page/base/{id}`
- `GET /app/client/templates/monitors-form/add-schedule_it_automation.json`
- `GET /app/api/current_status/type/SCHEDULE_IT_AUTOMATION`
- `POST /app/api/monitors`

---

## Zia Settings

### Q1. Show me all Zia AI workflow APIs

✅ **Mark Correct:** `GET /app/api/genai/workflows`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/alarms_assistant`
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`

---

### Q2. How do I get AI-generated recommendations?

✅ **Mark Correct:** `GET /app/api/dashboards/widgets/15698000407685848`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`
- `GET /app/api/dashboards/widgets/15698000407685854`
- `GET /app/api/dashboards/widgets/15698000407685856`
- `GET /app/api/dashboards/widgets/15698000407685858`

---

### Q3. What API lists AI data collections?

✅ **Mark Correct:** `GET /app/api/genai/collections`

📁 **Add to Dataset:**
- `GET /app/api/maintenance`
- `POST /app/api/maintenance`
- `PUT /app/api/maintenance/15698000489363071`
- `GET /sp/api/statuspages/15698000418173443/summary_details`

---

### Q4. Which endpoint retrieves a specific AI workflow by name?

✅ **Mark Correct:** `GET /app/api/genai/workflow/alarms_assistant`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`
- `GET /app/api/genai/workflow/server_assistant`
- `GET /app/api/genai/workflow/testagent`

---

### Q5. How do I fetch the list of monitors available to the AI module?

✅ **Mark Correct:** `GET /app/api/genai/module/monitorlist`

---

### Q6. What API retrieves AI task definitions?

✅ **Mark Correct:** `GET /app/api/genai/tasks`

📁 **Add to Dataset:**
- `GET /app/api/maintenance`

---

### Q7. How do I check the status of the alarms assistant AI workflow?

✅ **Mark Correct:** `GET /app/api/genai/workflow/alarms_assistant`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`
- `GET /app/api/genai/workflow/server_assistant`
- `GET /app/api/genai/workflow/website_assistant`

---

### Q8. Which endpoint configures the underlying AI/bot model?

✅ **Mark Correct:** `GET /app/api/bot/models`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/bot/models`

---

### Q9. How do I retrieve the Kubernetes AI assistant workflow?

✅ **Mark Correct:** `GET /app/api/genai/workflow/alarms_assistant`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`
- `GET /app/api/genai/workflow/server_assistant`
- `GET /app/api/genai/workflow/website_assistant`

---

### Q10. What API powers the APM AI assistant?

✅ **Mark Correct:** `GET /app/api/genai/workflow/apm_assistant`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/alarms_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`
- `GET /app/api/genai/workflow/server_assistant`
- `GET /app/api/genai/workflow/website_assistant`

---

### Q11. How do I list curated AI monitor collections?

✅ **Mark Correct:** `GET /app/api/genai/module/monitorlist`

📁 **Add to Dataset:**
- `GET /app/api/genai/collections`
- `GET /app/api/genai/collections`
- `GET /app/api/monitors/details_page/base/{id}`

---

### Q12. Which endpoint handles the problems assistant workflow?

✅ **Mark Correct:** `GET /app/api/genai/workflow/problems_assistant`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/alarms_assistant`
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/server_assistant`
- `GET /app/api/genai/workflow/website_assistant`

---

### Q13. What field identifies a specific AI workflow?

✅ **Mark Correct:** `GET /app/api/genai/workflows`

📁 **Add to Dataset:**
- `GET /app/api/genai/workflow/alarms_assistant`
- `GET /app/api/genai/workflow/apm_assistant`
- `GET /app/api/genai/workflow/kubernets_assistant`
- `GET /app/api/genai/workflow/problems_assistant`
- `GET /app/api/genai/workflow/server_assistant`

---

### Q14. How do I check AI recommendation status?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/summary_details`

📁 **Add to Dataset:**
- `GET /app/api/genai/recommendation`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /app/api/it_automation/monitor/status_details/{id}`
- `GET /app/api/maintenance/bulk_action/status`

---

### Q15. List all AI-related endpoints in Zia Settings

✅ **Mark Correct:** `GET /app/api/genai/module/monitorlist`

📁 **Add to Dataset:**
- `GET /app/api/metrics/list/METRICS`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/short/monitor_groups_list`
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`

---

## Server Monitor

### Q1. List all server templates configured

✅ **Mark Correct:** `GET /app/api/server_templates`

📁 **Add to Dataset:**
- `GET /app/api/short/server_templates`

---

### Q2. How do I create a new Resource Profile?

✅ **Mark Correct:** `GET /app/api/resource_profile/{id}`

📁 **Add to Dataset:**
- `GET /app/api/resource_profile`
- `GET /app/api/short/resource_profile`
- `POST https://www.site24x7.com/app/api/metric_profiles`
- `GET /app/api/resource_profile/associated_monitors`
- `GET /app/api/monitors_with_resource_profile/{id}`

---

### Q3. Which monitors are associated with a given Resource Profile?

✅ **Mark Correct:** `GET /app/api/resource_profile/associated_monitors`

📁 **Add to Dataset:**
- `GET /app/api/setting_profile/associated_monitors`

---

### Q4. What API manages Server Monitor Setting Profiles?

✅ **Mark Correct:** `GET /app/api/setting_profile`

📁 **Add to Dataset:**
- `GET /app/api/setting_profile/associated_monitors`
- `PUT /app/api/setting_profile/{id}`
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/short/setting_profile`

---

### Q5. How do I check available agent upgrade versions?

✅ **Mark Correct:** `GET /app/api/short/server/agent_upgradable_versions`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/short/server/agent_upgradable_versions`

---

### Q6. Which endpoint creates an Upgrade Profile for server agents?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/short/server/upgrade_profile_types`

📁 **Add to Dataset:**
- `GET /app/api/short/server/upgrade_profile_types`
- `POST https://www.site24x7.com/app/api/upgrade_profile`
- `GET /app/api/upgrade_profile/{id}`
- `GET /app/api/upgrade_profiles/FULLSTACK_AGENT`
- `PUT /app/api/upgrade_profile/{id}`

---

### Q7. What API retrieves APM Auto Profiler Rules?

✅ **Mark Correct:** `GET /app/api/apminsight/auto_profiler_rules/{id}`

📁 **Add to Dataset:**
- `GET /app/api/short/apminsight/auto_profiler_rules`
- `PUT /app/api/apminsight/auto_profiler_rules/{id}/DISABLE`

---

### Q8. How do I disable a specific Auto Profiler Rule?

✅ **Mark Correct:** `PUT /app/api/apminsight/auto_profiler_rules/{id}/DISABLE`

📁 **Add to Dataset:**
- `GET /app/api/apminsight/auto_profiler_rules/{id}`
- `GET /app/api/short/apminsight/auto_profiler_rules`

---

### Q9. List notification profiles used for server monitors

✅ **Mark Correct:** `GET /app/api/short/notification_profiles`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET /app/api/short/threshold_profiles/SERVER`
- `POST https://www.site24x7.com/app/api/notification_profiles`
- `PUT https://www.site24x7.com/app/api/notification_profiles/{id}`

---

### Q10. What field holds the threshold values for a server profile?

✅ **Mark Correct:** `GET /app/api/short/threshold_profiles/SERVER`

📁 **Add to Dataset:**
- `GET /app/api/short/threshold_profiles`
- `GET /app/api/short/threshold_profiles/{monitor_type}`
- `GET https://www.site24x7.com/app/api/threshold_profiles/{id}`
- `POST https://www.site24x7.com/app/api/threshold_profiles`
- `PUT https://www.site24x7.com/app/api/threshold_profiles/{id}`

---

### Q11. How do I check which features are available for server monitoring?

✅ **Mark Correct:** `GET /app/api/short/server_features`

📁 **Add to Dataset:**
- `GET /app/api/server_templates`

---

### Q12. Which API lists monitors using a specific server template?

✅ **Mark Correct:** `GET /app/api/server_templates`

📁 **Add to Dataset:**
- `GET /app/api/template_associated_monitors`
- `GET /app/api/short/server_templates`
- `GET /app/api/resource_profile/associated_monitors`
- `GET /app/api/setting_profile/associated_monitors`

---

### Q13. How do I retrieve threshold profiles for Server Monitor?

✅ **Mark Correct:** `GET /app/api/short/threshold_profiles/SERVER`

📁 **Add to Dataset:**
- `GET /app/api/short/threshold_profiles/{monitor_type}`
- `GET /app/api/short/threshold_profiles`
- `GET /app/api/monitor_groups`
- `GET /app/api/threshold_profiles`
- `GET https://www.site24x7.com/app/api/monitor_thresholds`

---

### Q14. What endpoint shows monitor resource support details?

✅ **Mark Correct:** `GET /app/api/short/monitors_resource_supported`

---

### Q15. How do I view monitor groups tied to server monitoring?

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/monitor_groups`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/server_features`
- `GET /app/api/server_templates`

---

## Plugin Monitor

### Q1. How do I enable plugin auto-discovery?

✅ **Mark Correct:** `PUT /app/api/plugin_configurations`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043639001`
- `GET /app/api/plugin/template/275039000043641001`

---

### Q2. What API toggles the plugin auto-discovery setting?

✅ **Mark Correct:** `PUT /app/api/plugin_configurations`

📁 **Add to Dataset:**
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/short/plugins`
- `GET /app/api/plugin/template/275039000043639001`

---

### Q3. List all plugin templates registered on the account

✅ **Mark Correct:** `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q4. Which endpoint fetches a specific plugin template's details?

✅ **Mark Correct:** `GET /app/api/plugin/template/275039000043639001`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q5. How do I check the current plugin configuration?

✅ **Mark Correct:** `PUT /app/api/plugin_configurations`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043639001`
- `GET /app/api/plugin/template/275039000043641001`
- `GET https://www.site24x7.com/app/api/plugin/list_threshold_profiles/PLUGIN`

---

### Q6. What field shows the number of attributes a plugin template reports?

✅ **Mark Correct:** `GET /app/api/plugin/listCustomTemplates/PLUGIN`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043639001`
- `GET /app/api/plugin/template/275039000043641001`

---

### Q7. How do I update the plugin monitor settings?

✅ **Mark Correct:** `PUT /app/api/plugin_configurations`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/short/plugins`

---

### Q8. Which API retrieves the iNodeMon plugin template?

✅ **Mark Correct:** `GET /app/api/plugin/template/275039000043639001`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q9. What endpoint is used to view a Redis plugin template?

✅ **Mark Correct:** `GET /app/api/plugin/template/275039000043639001`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q10. How do I list all registered plugin monitors?

✅ **Mark Correct:** `GET /app/api/plugin/listCustomTemplates/PLUGIN`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/plugin/list_threshold_profiles/PLUGIN`
- `GET /app/api/plugin/template/275039000043639001`
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/genai/module/monitorlist`

---

### Q11. What method is used to enable auto-discovery for plugins?

✅ **Mark Correct:** `GET /app/api/short/plugins`

---

### Q12. Which API shows plugin template version numbers?

✅ **Mark Correct:** `GET /app/api/plugin/template/275039000043639001`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q13. How do I check if a plugin template exists by ID?

✅ **Mark Correct:** `GET /app/api/plugin/template/275039000043639001`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043641001`
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`

---

### Q14. What endpoint manages plugin monitor configuration?

✅ **Mark Correct:** `PUT /app/api/plugin_configurations`

📁 **Add to Dataset:**
- `GET /app/api/plugin/template/275039000043639001`
- `GET /app/api/plugin/template/275039000043641001`
- `GET /app/api/monitor_groups`

---

### Q15. List APIs related to custom plugin scripts

✅ **Mark Correct:** `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

## Operations

### Q1. How do I create a scheduled maintenance window?

✅ **Mark Correct:** `POST /app/api/maintenance`

📁 **Add to Dataset:**
- `PUT /app/api/maintenance/15698000489363071`
- `GET /app/api/current_maintenance_list`
- `DELETE /app/api/maintenance/15698000489363071`

---

### Q2. List all currently active maintenance windows

✅ **Mark Correct:** `GET /app/api/current_maintenance_list`

📁 **Add to Dataset:**
- `GET /app/api/maintenance`
- `GET /app/api/maintenance`
- `POST /app/api/maintenance`
- `PUT /app/api/maintenance/15698000489363071`

---

### Q3. Which API deletes a specific maintenance window?

✅ **Mark Correct:** `GET /app/api/maintenance`

📁 **Add to Dataset:**
- `DELETE /app/api/maintenance/15698000489363071`
- `PUT /app/api/maintenance/15698000489363071`
- `GET /app/api/current_maintenance_list`

---

### Q4. How do I share a maintenance schedule as an iCal link?

✅ **Mark Correct:** `PUT /app/api/maintenance/ical`

📁 **Add to Dataset:**
- `GET /app/api/maintenance`
- `POST /app/api/maintenance`
- `PUT /app/api/maintenance/15698000489363071`
- `GET /app/api/current_maintenance_list`

---

### Q5. What endpoint retrieves the alert log search results?

✅ **Mark Correct:** `GET /app/api/applog/search/21-06-2026%2003:02:43/22-06-2026%2003:02:42/1-100/desc`

📁 **Add to Dataset:**
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:05/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:14/1-100/desc`
- `GET /app/api/applog/saved_searches`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:23/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:36/1-100/desc`

---

### Q6. How do I search alert logs by date range?

✅ **Mark Correct:** `GET /app/api/applog/search/21-06-2026%2003:02:43/22-06-2026%2003:02:42/1-100/desc`

📁 **Add to Dataset:**
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:05/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:14/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:23/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:36/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:42/1-100/desc`

---

### Q7. Which API fetches a log report for a specific monitor?

✅ **Mark Correct:** `GET /app/api/reports/log_reports/15698000329374414`

📁 **Add to Dataset:**
- `GET /app/api/reports/log_reports/15698000366175021`
- `GET /app/api/reports/log_reports/get_dc_type_location_settings/15698000329374414`
- `GET /app/api/reports/log_reports/get_dc_type_location_settings/15698000366175021`
- `GET /app/api/applog/dele_hid_monitors`
- `GET /app/api/scheduled_reports`

---

### Q8. What field shows the data collection type for log reports?

✅ **Mark Correct:** `GET /app/api/applog/logtype_resources/name`

📁 **Add to Dataset:**
- `GET /app/api/applog/logtype_views`
- `GET /app/api/reports/log_reports/get_dc_type_location_settings/15698000329374414`
- `GET /app/api/reports/log_reports/get_dc_type_location_settings/15698000366175021`
- `GET /app/api/applog/alerts`
- `GET /app/api/applog/search/21-06-2026%2003:02:43/22-06-2026%2003:02:42/1-100/desc`

---

### Q9. How do I schedule an IT Automation under Operations?

✅ **Mark Correct:** `GET /app/client/templates/monitors-form/add-schedule_it_automation.json`

📁 **Add to Dataset:**
- `GET /app/api/short/it_automation`
- `GET /app/api/current_status/type/SCHEDULE_IT_AUTOMATION`
- `GET /app/api/license_usage/SCHEDULE_IT_AUTOMATION`
- `GET /app/api/short/on_call_schedules`

---

### Q10. List all status pages configured under StatusIQ

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/short/statuspages`
- `GET /sp/api/statuspages/15698000418173443/summary_details`
- `POST /sp/api/statuspages/15698000418173443/incidents/active`

---

### Q11. How do I create a new incident on a status page?

✅ **Mark Correct:** `POST /sp/api/statuspages/15698000418173443/incidents/active`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443/summary_details`

---

### Q12. Which API checks the license access for a status page module?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/license/check_module_access`

📁 **Add to Dataset:**
- `GET /sp/api/short/subscription/statuspages_license`
- `GET /sp/api/short/statuspages`
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`

---

### Q13. What endpoint retrieves metrics data for a status page component?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/statuspages/15698000418173443/metrics/15698000441187245/data`
- `GET /sp/api/statuspages/15698000418173443/metrics/15698000441187249/data`
- `GET /sp/api/statuspages/15698000418173443/metrics/15698000486420001/data`

---

### Q14. How do I view resolved incidents on a status page?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443/components/15698000425317040/incidents/resolved`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443/components/15698000447030031/incidents/resolved`
- `GET /sp/api/statuspages/15698000418173443/incidents/resolved`
- `POST /sp/api/statuspages/15698000418173443/incidents/active`
- `POST /sp/api/statuspages/15698000418173443/incidents/active`
- `GET /sp/api/statuspages/15698000418173443`

---

### Q15. What API lists saved search queries for alert logs?

✅ **Mark Correct:** `GET /app/api/applog/saved_searches`

📁 **Add to Dataset:**
- `GET /app/api/applog/recent_search_queries`
- `GET /app/api/applog/search/21-06-2026%2003:02:43/22-06-2026%2003:02:42/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:05/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:14/1-100/desc`
- `GET /app/api/applog/search/22-06-2026%2000:00:00/22-06-2026%2003:03:23/1-100/desc`

---

## My Account

### Q1. How do I update my account settings?

✅ **Mark Correct:** `PUT /app/api/account_settings`

---

### Q2. Which API retrieves the current account-level settings?

✅ **Mark Correct:** `GET /app/api/short/sla_settings/monitors/2`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/sla_settings`
- `POST /app/api/sla_settings`
- `DELETE /app/api/sla_settings/15698000493103037`
- `PUT /app/api/sla_settings/15698000493103037`

---

### Q3. How do I change my personal status message?

✅ **Mark Correct:** `PUT /app/api/status_message`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443`
- `GET /app/api/monitors/status/count`
- `GET /app/api/short/current_status`
- `GET /app/api/monitors/status/count`

---

### Q4. What endpoint updates the web client language?

✅ **Mark Correct:** `PUT /app/api/webclient_language`

---

### Q5. Which API fetches a specific user's profile details?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/notification_profiles`

📁 **Add to Dataset:**
- `POST https://www.site24x7.com/app/api/credential_profile`
- `GET /app/api/client_data/user`
- `GET https://www.site24x7.com/app/api/account_settings`
- `GET https://www.site24x7.com/app/api/client_data/user`
- `GET https://www.site24x7.com/app/api/upgrade_profile/{id}`

---

### Q6. How do I change the report time zone in My Account?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `POST https://www.site24x7.com/app/api/reports/custom_reports/preview`
- `POST https://www.site24x7.com/app/api/reports/custom_reports/preview`

---

### Q7. What field controls the snackbar notification count?

✅ **Mark Correct:** `GET /app/api/account_settings`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET /app/api/short/notification_profiles`
- `POST https://www.site24x7.com/app/api/notification_profiles`

---

### Q8. Which API updates the default landing page after login?

✅ **Mark Correct:** `GET /sp/api/statuspages/15698000418173443`

📁 **Add to Dataset:**
- `GET /sp/api/short/statuspages`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443/summary_details`
- `POST /app/api/integration/pager_duty`

---

### Q9. How do I enable two-factor authentication for sensitive operations?

✅ **Mark Correct:** `GET /app/api/dashboards/15698000407685846`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`
- `GET /app/api/dashboards/widgets/15698000407685854`
- `GET /app/api/dashboards/widgets/15698000407685856`

---

### Q10. What endpoint changes the hour format for reports?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `GET /app/api/public_reports`
- `GET /app/api/short/business_hours`
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`

---

### Q11. How do I update my notification preferences?

✅ **Mark Correct:** `PUT https://www.site24x7.com/app/api/notification_profiles/{id}`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET https://www.site24x7.com/app/api/preferences/table/3`
- `POST https://www.site24x7.com/app/api/notification_profiles`
- `GET /app/api/short/notification_profiles`
- `GET /app/api/preferences/table/{table_id}`

---

### Q12. Which API retrieves organization-level language settings?

✅ **Mark Correct:** `PUT /app/api/webclient_language`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/sla_settings`
- `POST /app/api/sla_settings`

---

### Q13. What field holds the user's allowed monitor groups?

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/user_groups`
- `GET /app/api/short/monitor_groups`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/monitor_groups`

---

### Q14. How do I check which plan my account is subscribed to?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/account_settings`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `PUT /app/api/account_settings`
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`

---

### Q15. What endpoint updates account-level industry information?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/account_settings`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443`
- `GET https://www.site24x7.com/app/api/customize_report`
- `PUT /app/api/plugin_configurations`
- `PUT /app/api/plugin_configurations`
- `PUT /app/api/maintenance/15698000489363071`

---

## Report Settings

### Q1. How do I create a new scheduled report?

✅ **Mark Correct:** `POST /app/api/send_scheduled_reports`

📁 **Add to Dataset:**
- `GET /app/api/scheduled_reports`
- `PUT /app/api/scheduled_reports/15698000342022005`
- `DELETE /app/api/scheduled_reports/15698000342022005`
- `PUT /app/api/scheduled_reports/activate/15698000342022005`

---

### Q2. Which API activates a previously created scheduled report?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `DELETE /app/api/scheduled_reports/15698000342022005`
- `PUT /app/api/scheduled_reports/activate/15698000342022005`

---

### Q3. What endpoint sends a scheduled report immediately?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `DELETE /app/api/scheduled_reports/15698000342022005`
- `PUT /app/api/scheduled_reports/activate/15698000342022005`

---

### Q4. How do I delete a scheduled report?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `DELETE /app/api/scheduled_reports/15698000342022005`
- `PUT /app/api/scheduled_reports/activate/15698000342022005`

---

### Q5. Which API customizes the report logo and branding?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `DELETE /app/api/customize_report`
- `GET /app/api/customize_report`

---

### Q6. What field controls the decimal precision for availability percentage?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/monitor_thresholds`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/client_data/demo`
- `GET https://www.site24x7.com/app/api/threshold_profiles/{id}`
- `GET https://www.site24x7.com/app/api/short/business_hours`
- `GET /app/api/short/is_poller_available`
- `GET /app/api/reports/alarm/{id}`

---

### Q7. How do I create an SLA setting for a monitor?

✅ **Mark Correct:** `GET /app/api/short/sla_settings/monitors/2`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/3`
- `POST /app/api/sla_settings`
- `PUT /app/api/sla_settings/15698000493103037`
- `GET /app/api/setting_profile/associated_monitors`
- `GET /app/api/sla_settings`

---

### Q8. Which API retrieves SLA settings for a specific monitor?

✅ **Mark Correct:** `GET /app/api/short/sla_settings/monitors/2`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/3`
- `POST /app/api/sla_settings`
- `PUT /app/api/sla_settings/15698000493103037`
- `GET /app/api/sla_settings`
- `DELETE /app/api/sla_settings/15698000493103037`

---

### Q9. What endpoint deletes an existing SLA configuration?

✅ **Mark Correct:** `DELETE /app/api/sla_settings/15698000493103037`

📁 **Add to Dataset:**
- `POST /app/api/sla_settings`
- `GET /app/api/integration/slack/15698000442055001`
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`

---

### Q10. How do I list business hours used in report scheduling?

✅ **Mark Correct:** `GET /app/api/short/business_hours`

📁 **Add to Dataset:**
- `PUT https://www.site24x7.com/app/api/business_hours/{id}`
- `GET https://www.site24x7.com/app/api/business_hours`
- `GET /app/api/metrics/list/METRICS`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`
- `GET /app/api/short/monitor_groups_list`

---

### Q11. Which API retrieves custom report templates for a scheduled report?

✅ **Mark Correct:** `GET /app/api/scheduled_reports`

📁 **Add to Dataset:**
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `GET /app/api/short/reports/custom_reports`
- `GET /app/api/plugin/listCustomTemplates/PLUGIN`

---

### Q12. What field defines the SLA goal percentage?

✅ **Mark Correct:** `POST /app/api/sla_settings`

📁 **Add to Dataset:**
- `PUT /app/api/sla_settings/15698000493103037`
- `GET /app/api/integration/slack/15698000442055001`
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`

---

### Q13. How do I check which monitor groups are available for a report?

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/short/monitor_groups_list`
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/monitor_groups`

---

### Q14. Which API lists tags usable in report filters?

✅ **Mark Correct:** `GET /app/api/short/tags`

📁 **Add to Dataset:**
- `GET /app/api/scheduled_reports`
- `PUT /app/api/customize_report`
- `PUT /app/api/customize_report`
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`

---

### Q15. What endpoint updates report customization settings like sender email?

✅ **Mark Correct:** `GET /app/api/short/reports/custom_reports`

📁 **Add to Dataset:**
- `PUT /app/api/customize_report`
- `PUT /app/api/customize_report`
- `PUT /app/api/scheduled_reports/15698000342022005`
- `PUT /app/api/sla_settings/15698000493103037`
- `GET /app/api/scheduled_reports`

---

## Share

### Q1. How do I create an Uptime Button?

✅ **Mark Correct:** `POST /app/api/uptime_buttons`

---

### Q2. Which API lists existing Uptime Buttons?

✅ **Mark Correct:** `POST /app/api/uptime_buttons`

---

### Q3. What endpoint creates a new Operations Dashboard?

✅ **Mark Correct:** `GET /app/api/dashboards/widgets/15698000407685854`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685856`
- `GET /app/api/dashboards/widgets/15698000407685858`
- `GET /app/api/dashboards/widgets/15698000407685860`
- `GET /app/api/dashboards/widgets/15698000407685862`
- `GET /app/api/dashboards/widgets/15698000407685864`

---

### Q4. How do I delete a specific Operations Dashboard?

✅ **Mark Correct:** `GET /app/api/dashboards/15698000407685846`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`
- `GET /app/api/dashboards/widgets/15698000407685854`
- `GET /app/api/dashboards/widgets/15698000407685856`

---

### Q5. Which API retrieves the list of public reports?

✅ **Mark Correct:** `GET /app/api/public_reports`

📁 **Add to Dataset:**
- `DELETE /app/api/public_reports/15698000325373001`
- `PUT /app/api/public_reports/15698000325373001`
- `GET /app/api/reports/custom_reports`
- `GET https://www.site24x7.com/app/api/public_reports`

---

### Q6. How do I publish a new Public Report?

✅ **Mark Correct:** `GET /app/api/public_reports`

📁 **Add to Dataset:**
- `PUT /app/api/public_reports/15698000325373001`
- `DELETE /app/api/public_reports/15698000325373001`
- `GET https://www.site24x7.com/app/api/public_reports`
- `GET /app/api/reports/custom_reports`

---

### Q7. What field controls which monitors are shown on an Uptime Button?

✅ **Mark Correct:** `POST /app/api/uptime_buttons`

---

### Q8. Which API updates an existing Operations Dashboard?

✅ **Mark Correct:** `GET /app/api/dashboards/15698000407685846`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`
- `GET /app/api/dashboards/widgets/15698000407685854`
- `GET /app/api/dashboards/widgets/15698000407685856`

---

### Q9. How do I get the embed code for a shared dashboard?

✅ **Mark Correct:** `GET /app/api/dashboards/15698000407685846`

📁 **Add to Dataset:**
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`
- `GET /app/api/dashboards/widgets/15698000407685854`
- `GET /app/api/dashboards/widgets/15698000407685856`

---

### Q10. What endpoint deletes a Public Report?

✅ **Mark Correct:** `GET /app/api/public_reports`

📁 **Add to Dataset:**
- `DELETE /app/api/public_reports/15698000325373001`
- `PUT /app/api/public_reports/15698000325373001`
- `GET /app/api/reports/custom_reports`

---

### Q11. Which API lists monitor groups available for sharing?

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/monitors/pollergroups`
- `GET /app/api/short/monitor_groups`
- `GET /app/api/short/monitor_groups`

---

### Q12. How do I check which plugins are available when publishing a report?

✅ **Mark Correct:** `GET /app/api/short/plugins`

📁 **Add to Dataset:**
- `GET /app/api/scheduled_reports`
- `PUT /app/api/scheduled_reports/15698000342022005`
- `POST /app/api/send_scheduled_reports`
- `POST /app/api/send_scheduled_reports`
- `DELETE /app/api/customize_report`

---

### Q13. What field holds the permalink for a shared dashboard?

✅ **Mark Correct:** `GET /app/api/dashboards/15698000407685846`

📁 **Add to Dataset:**
- `GET /app/api/dashboard_views`
- `GET /app/api/short/dashboards/favourites`
- `GET /app/api/dashboards/widgets/15698000407685848`
- `GET /app/api/dashboards/widgets/15698000407685850`
- `GET /app/api/dashboards/widgets/15698000407685852`

---

### Q14. Which API retrieves custom reports available for public sharing?

✅ **Mark Correct:** `GET /app/api/public_reports`

📁 **Add to Dataset:**
- `GET /app/api/reports/custom_reports`
- `DELETE /app/api/public_reports/15698000325373001`
- `PUT /app/api/public_reports/15698000325373001`
- `GET /app/api/short/reports/custom_reports`

---

### Q15. How do I list business hours available when publishing a report?

✅ **Mark Correct:** `PUT https://www.site24x7.com/app/api/business_hours/{id}`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/business_hours`
- `GET /app/api/short/business_hours`
- `GET /app/api/scheduled_reports`
- `POST https://www.site24x7.com/app/api/business_hours`

---

## Milestones

### Q1. How do I create a new milestone?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

📁 **Add to Dataset:**
- `GET /app/api/monitor_groups?subgroup_required=true`

---

### Q2. Which API updates the default milestone marker setting?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

---

### Q3. What endpoint loads monitor groups for milestone association?

✅ **Mark Correct:** `GET /app/api/monitor_groups`

📁 **Add to Dataset:**
- `GET /app/api/monitor_groups?subgroup_required=true`
- `GET /app/api/short/monitor_groups`
- `GET /app/api/monitors/pollergroups`

---

### Q4. How do I check which monitor a milestone is tied to?

✅ **Mark Correct:** `GET /app/api/short/monitors_resource_supported`

📁 **Add to Dataset:**
- `GET /app/api/monitors/details_page/base/{id}`
- `GET /app/api/monitor_groups`
- `GET /app/api/monitor_groups?subgroup_required=true`
- `GET /app/api/short/monitors_support/6001`
- `GET /app/api/short/monitor_groups`

---

### Q5. What field controls milestone marker visibility?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

---

### Q6. Which API fetches the current user's profile for the Milestones page?

✅ **Mark Correct:** `GET /app/api/client_data/user`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/credential_profiles`
- `GET https://www.site24x7.com/app/api/notification_profiles`
- `GET /sp/api/statuspages/15698000418173443/summary_details`

---

### Q7. How do I retrieve account-level configuration before viewing milestones?

✅ **Mark Correct:** `GET /app/api/client_data/account`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `GET /app/api/monitor_groups?subgroup_required=true`
- `POST https://www.site24x7.com/app/api/apminsight/agent_config_profile`
- `DELETE https://www.site24x7.com/app/api/apminsight/agent_config_profile/{id}`
- `GET https://www.site24x7.com/app/api/apminsight/agent_config_profile/{id}`

---

### Q8. What endpoint loads global settings required by the Milestones module?

✅ **Mark Correct:** `GET /app/api/client_data/globals`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`
- `GET /app/api/short/sla_settings/monitors/2`
- `GET /app/api/short/sla_settings/monitors/3`

---

### Q9. Which API manages milestone marker behavior (Monitor/Group/Global)?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

---

### Q10. How do I list milestones associated with a specific monitor group?

✅ **Mark Correct:** `GET /app/api/monitors/pollergroups`

📁 **Add to Dataset:**
- `GET /app/api/monitor_groups`
- `GET /app/api/resource_profile/associated_monitors`
- `GET /app/api/setting_profile/associated_monitors`
- `GET /app/api/monitor_groups`
- `GET /app/api/short/monitor_groups_list`

---

### Q11. What field holds the milestone name?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

📁 **Add to Dataset:**
- `GET /app/api/applog/logtype_resources/name`

---

### Q12. Which API checks subscription details before rendering milestones?

✅ **Mark Correct:** `GET /app/api/client_data/account`

📁 **Add to Dataset:**
- `GET /sp/api/statuspages/15698000418173443/summary_details`
- `GET /app/api/dashboards/15698000407685846`
- `GET /sp/api/short/subscription/statuspages_license`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`

---

### Q13. How do I fetch demo mode flags for the Milestones page?

✅ **Mark Correct:** `GET /app/api/client_data/demo`

📁 **Add to Dataset:**
- `GET /sp/api/short/statuspages`
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443/summary_details`

---

### Q14. What endpoint is used to mark a new deployment milestone?

✅ **Mark Correct:** `PUT /app/api/milestone/default_marker`

---

### Q15. Which API loads dashboard preferences for the Milestones view?

✅ **Mark Correct:** `GET /app/api/dashboard_views`

📁 **Add to Dataset:**
- `GET /app/api/short/dashboards/favourites`
- `GET /app/api/short/dashboards/favourites`
- `DELETE /app/api/dashboard_views/15698000033393001`

---

## Third-Party Integrations

### Q1. How do I set up PagerDuty alerts?

✅ **Mark Correct:** `GET /app/api/short/sla_settings/monitors/2`

📁 **Add to Dataset:**
- `GET /app/api/short/sla_settings/monitors/3`
- `GET /app/api/sla_settings`
- `POST /app/api/sla_settings`
- `DELETE /app/api/sla_settings/15698000493103037`
- `PUT /app/api/sla_settings/15698000493103037`

---

### Q2. Which API creates a Slack integration?

✅ **Mark Correct:** `POST /app/api/integration/slack`

📁 **Add to Dataset:**
- `POST /app/api/integration/pager_duty`
- `POST /app/api/integration/opsgenie`
- `POST /app/api/integration/moogsoft`
- `POST /app/api/integration/fresh_service`
- `POST /app/api/integration/zen_desk`

---

### Q3. How do I configure a webhook integration?

✅ **Mark Correct:** `POST /app/api/integration/webhooks`

📁 **Add to Dataset:**
- `POST /app/api/integration/slack`
- `POST /app/api/integration/discord`
- `GET /app/api/zanalytics/integration_info`
- `POST /app/api/integration/appmanager`

---

### Q4. What endpoint creates a ServiceNow integration?

✅ **Mark Correct:** `POST /app/api/integration/service_now`

📁 **Add to Dataset:**
- `POST /app/api/integration/webhooks`
- `POST /app/api/integration/sdp`
- `POST /app/api/integration/sdp`
- `POST /app/api/integration/zia_azure`
- `POST /app/api/integration/pager_duty`

---

### Q5. Which API retrieves ServiceNow CMDB monitor type mappings?

✅ **Mark Correct:** `GET /app/api/integration/cmdbMonitorTypes`

📁 **Add to Dataset:**
- `GET /app/api/monitor_groups`

---

### Q6. How do I check the ServiceNow CMDB sync status?

✅ **Mark Correct:** `GET /app/api/integration/snow_cmdb_status`

---

### Q7. What API integrates with Opsgenie?

✅ **Mark Correct:** `POST /app/api/integration/opsgenie`

---

### Q8. How do I connect Site24x7 to Microsoft Teams or Discord?

✅ **Mark Correct:** `POST /app/api/integration/discord`

📁 **Add to Dataset:**
- `POST /app/api/integration/connectwise`
- `GET /sp/api/public/site24x7_perf_data/cR--BisT9ddaXXF3PzQ2JDsu5nPDyjqwPtrPU4-pB64f_aHC0juFXg6xidCsteOu`
- `GET /sp/api/public/site24x7_perf_data/cR--BisT9ddaXXF3PzQ2JDsu5nPDyjqwPtrPU4-pB650_WFJl3TOkWDRjoMpE0bN`

---

### Q9. Which API sets up a Zoho Cliq integration?

✅ **Mark Correct:** `GET /app/api/zcliq/org_details`

📁 **Add to Dataset:**
- `GET /app/api/zcliq/users`
- `POST /app/api/zcliq/channel`
- `GET /app/api/short/zcliq/channels`
- `GET /app/api/zanalytics/integration_info`
- `POST /app/api/integration/zia_zks`

---

### Q10. How do I configure Splunk On-Call as an integration?

✅ **Mark Correct:** `POST /app/api/integration/victorops`

---

### Q11. What endpoint lists all supported third-party integration providers?

✅ **Mark Correct:** `GET /app/api/short/third_party_services`

📁 **Add to Dataset:**
- `POST /app/api/integration/webhooks`
- `POST /app/api/integration/sdp`
- `POST /app/api/integration/sdp`
- `GET /app/api/integration/zia_byok/{id}`
- `GET /app/api/oauth2_providers`

---

### Q12. Which API connects to Amazon EventBridge?

✅ **Mark Correct:** `POST /app/api/integration/event_bridge`

📁 **Add to Dataset:**
- `GET /app/api/aws/add/event_bridge/{user_id}`

---

### Q13. How do I set up an Azure OpenAI integration?

✅ **Mark Correct:** `POST /app/api/integration/zia_azure`

📁 **Add to Dataset:**
- `GET /app/api/integration/thirdparty_status/36`
- `POST /app/api/integration/azure_workspace`
- `GET /app/api/integration/thirdparty_status/41`

---

### Q14. What field maps ServiceNow CMDB attributes to Site24x7 fields?

✅ **Mark Correct:** `GET /app/api/integration/cmdb_json_mapper`

📁 **Add to Dataset:**
- `GET /app/api/integration/cmdbMonitorTypes`
- `GET /app/api/integration/snow_cmdb_status`
- `GET /app/api/integration/sdpod_cmdb_json_mapper`

---

### Q15. Which API configures a Jira Service Management integration?

✅ **Mark Correct:** `POST /app/api/integration/jsmops`

📁 **Add to Dataset:**
- `POST /app/api/integration/fresh_service`
- `POST /app/api/integration/service_now`
- `POST /app/api/integration/zia_zks`
- `PUT /app/api/integration/thirdparty_service/suspend/{id}`

---

## Tags

### Q1. How do I add a tag to a monitor?

✅ **Mark Correct:** `GET /app/client/templates/monitors-form/add-amazon.json`

📁 **Add to Dataset:**
- `GET /app/client/templates/monitors-form/add-arubacentral-switch.json`
- `GET /app/client/templates/monitors-form/add-dbricks_ws.json`
- `GET /app/client/templates/monitors-form/add-isp.json`
- `GET /app/client/templates/monitors-form/add-saas_application.json`
- `GET /app/client/templates/monitors-form/add-ssl_cert.json`

---

### Q2. List all tags configured in the account

✅ **Mark Correct:** `GET /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/tags_list`
- `GET /app/api/client_data/account`
- `GET /app/api/account_settings`

---

### Q3. Which API creates a new tag?

✅ **Mark Correct:** `POST /app/api/tags`

---

### Q4. What field holds the tag's color?

✅ **Mark Correct:** `POST /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/user_tags`
- `GET /app/api/short/tags`
- `GET /app/api/short/tags`

---

### Q5. How do I check which monitors are associated with a specific tag?

✅ **Mark Correct:** `GET /app/api/resource_profile/associated_monitors`

📁 **Add to Dataset:**
- `GET /app/api/setting_profile/associated_monitors`
- `GET /app/api/associated_tags`
- `GET /app/api/template_associated_monitors`
- `GET /app/api/tags/monitors`

---

### Q6. What endpoint retrieves saved table preferences for the Tags view?

✅ **Mark Correct:** `GET /app/api/preferences/table/14`

📁 **Add to Dataset:**
- `GET /app/api/preferences/table/27`
- `GET /app/api/preferences/table/{table_id}`
- `GET /app/api/preferences/table/22`
- `GET /app/api/preferences/table/23`
- `GET /app/api/preferences/table/24`

---

### Q7. Which API logs a change-tracking event for tag actions?

✅ **Mark Correct:** `PUT /app/api/tracker`

📁 **Add to Dataset:**
- `GET /app/api/applog/short/logtag_rules/15698000407685844`
- `POST /app/api/tags`
- `GET /app/api/tags`
- `POST /app/api/integration/event_bridge`
- `GET /app/api/applog/logtype_resources/name`

---

### Q8. How do I delete an existing tag?

✅ **Mark Correct:** `POST /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/tags`
- `GET /app/api/short/tags_list`
- `GET /app/api/short/user_tags`
- `PUT /app/api/reports/outage/{id}`

---

### Q9. What field distinguishes a tag's name from its value?

✅ **Mark Correct:** `POST /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/user_tags`
- `GET /app/api/applog/logtype_resources/name`
- `GET /app/api/short/tags`
- `GET /app/api/short/tags`

---

### Q10. Which API records when a tag is applied to a monitor?

✅ **Mark Correct:** `GET /app/api/tags/monitors`

📁 **Add to Dataset:**
- `POST /app/api/tags`
- `GET /app/api/monitors/details_page/base/{id}`
- `GET /app/api/monitor_groups`
- `GET /app/api/network/pollers`
- `GET /app/api/short/tags`

---

### Q11. How do I list tags filtered by tag type?

✅ **Mark Correct:** `GET /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/user_tags`
- `GET /app/api/short/tags_list`
- `GET /app/api/short/tags`
- `GET /app/api/short/tags`

---

### Q12. What endpoint loads account context before rendering the Tags page?

✅ **Mark Correct:** `GET /app/api/client_data/account`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`

---

### Q13. Which API checks session/user context for the Tags module?

✅ **Mark Correct:** `GET /app/api/genai/module/monitorlist`

📁 **Add to Dataset:**
- `GET /app/api/client_data/account`
- `GET /app/api/client_data/demo`
- `GET /app/api/tags`
- `GET /app/api/client_data/user`
- `GET /app/api/short/tags`

---

### Q14. How do I retrieve the column order saved for the Tags table?

✅ **Mark Correct:** `GET /app/api/preferences/table/14`

📁 **Add to Dataset:**
- `GET /app/api/preferences/table/27`
- `GET /app/api/preferences/table/{table_id}`

---

### Q15. What status code do tag creation requests return in the demo account?

✅ **Mark Correct:** `POST /app/api/tags`

📁 **Add to Dataset:**
- `GET /app/api/short/current_status`
- `GET /app/api/short/current_status`
- `GET https://www.site24x7.com/app/api/short/current_status`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`

---

## Downloads

### Q1. How do I download the Java APM agent?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`

📁 **Add to Dataset:**
- `POST /app/api/apminsight/download/JAVA`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA`
- `POST /app/api/apminsight/download/DOTNET`

---

### Q2. Which API records a .NET APM agent download event?

✅ **Mark Correct:** `POST /app/api/apminsight/download/DOTNET`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `POST /app/api/apminsight/download/JAVA`
- `POST /app/api/apminsight/download/RUBY`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`

---

### Q3. What endpoint downloads the Ruby APM monitoring agent?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `POST /app/api/apminsight/download/RUBY`

---

### Q4. How do I check how many times an agent has been downloaded?

✅ **Mark Correct:** `GET https://www.site24x7.com/app/api/apminsight/agent_config_profile/{id}`

📁 **Add to Dataset:**
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA`
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/PYTHON`
- `GET https://www.site24x7.com/app/api/short/apminsight/agent_config_profiles`
- `POST https://www.site24x7.com/app/api/apminsight/agent_config_profile`

---

### Q5. Which API initiates the Java APM agent download workflow?

✅ **Mark Correct:** `POST /app/api/apminsight/download/JAVA`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `POST /app/api/apminsight/download/DOTNET`
- `POST /app/api/apminsight/download/RUBY`
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`

---

### Q6. What field tracks the download counter for an agent?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`
- `PUT /app/api/download_count`
- `POST /app/api/apminsight/download/JAVA`
- `POST /app/api/apminsight/download/DOTNET`

---

### Q7. How do I get the direct download link for the .NET APM agent installer?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`

📁 **Add to Dataset:**
- `POST /app/api/apminsight/download/DOTNET`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`
- `POST /app/api/apminsight/download/JAVA`
- `POST /app/api/apminsight/download/RUBY`

---

### Q8. Which API fetches account context before showing downloads?

✅ **Mark Correct:** `GET /app/api/client_data/account`

📁 **Add to Dataset:**
- `GET /app/api/account_settings`
- `GET /app/api/account_settings`
- `PUT /app/api/account_settings`

---

### Q9. What endpoint loads dashboard preferences for the Downloads page?

✅ **Mark Correct:** `GET /app/api/short/dashboards/favourites`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`

---

### Q10. How do I download the Ruby APM agent gem package?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`

📁 **Add to Dataset:**
- `POST /app/api/apminsight/download/RUBY`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`

---

### Q11. Which API checks user context before rendering the Downloads module?

✅ **Mark Correct:** `GET /app/api/client_data/user`

📁 **Add to Dataset:**
- `GET /app/api/short/users_list`

---

### Q12. What status code is returned when recording a Java agent download?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`

📁 **Add to Dataset:**
- `POST /app/api/apminsight/download/JAVA`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`
- `GET https://www.site24x7.com/app/api/apminsight/default_agent_config_profile/JAVA`

---

### Q13. How do I find the static download URL for the .NET agent MSI?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`

---

### Q14. Which API loads bootstrap/demo metadata for the Downloads page?

✅ **Mark Correct:** `GET /app/api/client_data/demo`

📁 **Add to Dataset:**
- `GET /sp/api/short/statuspages`
- `GET /sp/api/statuspages/15698000418173443`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000425317040`
- `GET /sp/api/statuspages/15698000418173443/components/summary_details/15698000447030031`
- `GET /sp/api/statuspages/15698000418173443/summary_details`

---

### Q15. What endpoint is used to track agent download counts account-wide?

✅ **Mark Correct:** `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-javaagent.zip`

📁 **Add to Dataset:**
- `GET https://staticdownloads.site24x7.com/apminsight/agents/apminsight-dotnetagent.msi`
- `GET https://staticdownloads.site24x7.com/apminsight/agents/site24x7_apminsight.gem`
- `POST /app/api/apminsight/download/JAVA`
- `POST /app/api/apminsight/download/DOTNET`
- `POST /app/api/apminsight/download/RUBY`

---

