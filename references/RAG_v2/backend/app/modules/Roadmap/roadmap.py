import json
import os
import math
from datetime import datetime, timedelta

TAGS_DIR = "tags/"
ANALYTICS_DIR = "analytics/"
ROADMAPS_DIR = "analytics/roadmaps/"

def load_subject_units(subject):
    file_path = os.path.join(TAGS_DIR, f"{subject}.json")
    
    if not os.path.exists(file_path):
        return {"error": f"No tags found for {subject}"}
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "units" not in data:
            return {"error": f"No unit structure for {subject}"}
        
        return data["units"]
        
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format"}
    
def load_weak_topics(subject):
    history_file = os.path.join(ANALYTICS_DIR, "quiz_history.json")
    
    if not os.path.exists(history_file):
        return []
    
    with open(history_file, "r") as f:
        history = json.load(f)
    
    # Filter by subject
    subject_history = [h for h in history 
                      if h["subject"].lower() == subject.lower()]
    
    if not subject_history:
        return []
    
    # Count frequency of each weak topic
    topic_count = {}
    for attempt in subject_history:
        for topic in attempt["weak_topics"]:
            topic_count[topic] = topic_count.get(topic, 0) + 1
    
    # Sort by frequency → most weak first
    sorted_topics = sorted(topic_count.items(), 
                          key=lambda x: x[1], reverse=True)
    
    return [topic for topic, count in sorted_topics]

def get_roadmap_structure(units, weak_topics, llm):
    prompt = f"""You are a study planner.
Given these subject units and topics, estimate study hours per topic.

Rules:
- Weak topics need MORE time (add 1-2 extra hours)
- Order topics within each unit: beginner first
- Hours per topic: minimum 1, maximum 4
- Return ONLY a JSON array matching the input structure

Weak topics that need priority: {weak_topics}

Units and topics:
{json.dumps(units, indent=2)}

Return format:
[
  {{
    "unit": 1,
    "name": "unit name",
    "topics": [
      {{"name": "topic name", "hours": 2, "is_weak": false}}
    ]
  }}
]"""

    response = llm.invoke(prompt)
    from app.modules.Quiz.quiz import parse_json_response
    return parse_json_response(response.content)

def build_weekly_schedule(roadmap_structure, hours_per_day, start_date):
    weeks = []
    current_week = 1
    current_day = 0
    week_topics = []
    
    start = datetime.strptime(start_date, "%Y-%m-%d")
    
    for unit in roadmap_structure:
        for topic in unit["topics"]:
            days_needed = math.ceil(topic["hours"] / hours_per_day)
            
            topic["days_needed"] = days_needed
            topic["status"] = "not_started"
            topic["completed_date"] = None
            
            week_topics.append({
                "unit": unit["unit"],
                "unit_name": unit["name"],
                "topic": topic
            })
            
            current_day += days_needed
            
            # Start new week every 7 days
            if current_day >= 7 * current_week:
                week_start = start + timedelta(days=(current_week-1)*7)
                week_end = week_start + timedelta(days=6)
                
                weeks.append({
                    "week": current_week,
                    "start_date": week_start.strftime("%Y-%m-%d"),
                    "end_date": week_end.strftime("%Y-%m-%d"),
                    "topics": week_topics.copy()
                })
                week_topics = []
                current_week += 1
    
    # Add remaining topics to last week
    if week_topics:
        week_start = start + timedelta(days=(current_week-1)*7)
        week_end = week_start + timedelta(days=6)
        weeks.append({
            "week": current_week,
            "start_date": week_start.strftime("%Y-%m-%d"),
            "end_date": week_end.strftime("%Y-%m-%d"),
            "topics": week_topics
        })
    
    return weeks

# supabase integration for roadmap generation
def generate_roadmap(subject, hours_per_day, target_date, scope, unit_number=None, llm=None, user_id=None):
    from app.core.supabase_client import supabase
    # load units
    units = load_subject_units(subject)
    if "error" in units:
        return units
    
    #filter by scope
    if scope == "unit" and unit_number:
        units = [u for u in units if u["unit"] == unit_number]
        if not units:
            return {"error": f"Unit {unit_number} not found"}
    
    # load weak topics
    weak_topics = load_weak_topics(subject)
    
    #get LLM ordered structure
    roadmap_structure = get_roadmap_structure(units, weak_topics, llm)
    
    #build weekly schedule
    start_date = datetime.now().strftime("%Y-%m-%d")
    weeks = build_weekly_schedule(roadmap_structure, hours_per_day, start_date)
    
    roadmap = supabase.table("roadmaps").insert({
        "subject": subject,
        "scope": scope,
        "unit_number": unit_number,
        "hours_per_day": hours_per_day,
        "target_date": target_date,
        "created_at": datetime.now().isoformat(),
        "status": "active",
        "weeks": weeks,
        "weak_topics": weak_topics,
        "user_id": user_id
        })

    roadmap_response = roadmap.execute()
    return roadmap_response.data[0] if roadmap_response.data else {"error": "Failed to create roadmap"}

# older one
def save_roadmap(subject, roadmap):
    # One roadmap per subject
    filepath = os.path.join(ROADMAPS_DIR, f"roadmap_{subject}.json")
    
    with open(filepath, "w") as f:
        json.dump(roadmap, f, indent=2)

# supabase updated
def load_roadmap(subject, user_id=None):
    from app.core.supabase_client import supabase

    print("Searching:", subject, user_id)

    results = (
        supabase.table("roadmaps")
        .select("*")
        .eq("subject", subject)
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    )

    print("Supabase returned:", results.data)

    if not results.data:
        return None

    return results.data[0]
    
# supabase check for existing roadmap 
def check_existing_roadmap(subject, user_id=None):
    from app.core.supabase_client import supabase

    results = (
        supabase.table("roadmaps")
        .select("*")
        .eq("subject", subject)
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    )

    print(results.data)

    return len(results.data) > 0