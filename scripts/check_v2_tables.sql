SELECT
  t.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM (
  VALUES
    ('pet_stories'),
    ('pet_story_views'),
    ('vet_visit_prep_briefs'),
    ('symptom_correlations'),
    ('behavior_alerts'),
    ('activity_timeline'),
    ('medication_interactions'),
    ('weight_goal_progress'),
    ('dental_records'),
    ('birthday_cards'),
    ('daily_mood_summary'),
    ('pet_year_reviews'),
    ('pet_expenses'),
    ('monthly_spend_summary'),
    ('responsibilities'),
    ('responsibility_completions'),
    ('lab_results'),
    ('quick_action_log'),
    ('vet_visit_handoffs'),
    ('smart_reminder_suggestions'),
    ('bulk_reminder_actions'),
    ('indian_pet_products'),
    ('pet_product_purchases'),
    ('indian_vets'),
    ('community_posts'),
    ('behavior_metrics'),
    ('feeding_schedules'),
    ('device_widget_state'),
    ('assistant_commands')
) AS want(name)
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = want.name
ORDER BY want.name;
