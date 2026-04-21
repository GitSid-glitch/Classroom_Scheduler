import json
import os
from urllib import error, request


def explain_unscheduled_session(class_session, unscheduled_items):
    for item in unscheduled_items:
        if item["class"].id != class_session.id:
            continue

        return {
            "class_session": class_session.id,
            "subject": class_session.subject,
            "explanation": item["reason"],
            "action_hint": _build_action_hint(item["reason"]),
        }

    return {
        "class_session": class_session.id,
        "subject": class_session.subject,
        "explanation": "This session is currently scheduled, so no unscheduled explanation is needed.",
        "action_hint": "Inspect room fit, teacher load, or quality scoring if you still want to improve placement.",
    }


def suggest_conflict_resolution(schedule_result):
    unscheduled = schedule_result.get("unscheduled", [])
    conflicts = schedule_result.get("conflicts", [])

    if unscheduled:
        top_item = unscheduled[0]
        return {
            "title": f"Resolve {top_item['class'].subject} first",
            "suggestion": _build_action_hint(top_item["reason"]),
        }

    if conflicts:
        top_conflict = conflicts[0]
        return {
            "title": top_conflict["title"],
            "suggestion": "Review this conflict first and consider locking the higher-priority session before regenerating.",
        }

    return {
        "title": "Draft looks healthy",
        "suggestion": "No urgent issues were detected. The next useful step is publish review or timetable quality optimization.",
    }


def build_assistant_payload(schedule_result, target_explanation, explanations):
    fallback = {
        "source": "rules",
        "suggestion": suggest_conflict_resolution(schedule_result),
        "explanation": target_explanation,
        "explanations": explanations,
    }

    api_key = os.environ.get("GROQ_API_KEY")
    model = os.environ.get("GROQ_MODEL")

    if not api_key or not model:
        return fallback

    prompt = _build_ai_prompt(schedule_result, target_explanation, explanations)

    try:
        ai_result = _request_ai_guidance(api_key, model, prompt)
    except Exception:
        return fallback

    return {
        "source": "llm",
        "model": model,
        "suggestion": {
            "title": ai_result.get("title") or fallback["suggestion"]["title"],
            "suggestion": ai_result.get("suggestion") or fallback["suggestion"]["suggestion"],
        },
        "explanation": {
            "class_session": target_explanation["class_session"] if target_explanation else None,
            "subject": ai_result.get("subject") or (target_explanation["subject"] if target_explanation else ""),
            "explanation": ai_result.get("explanation")
            or (target_explanation["explanation"] if target_explanation else fallback["suggestion"]["suggestion"]),
            "action_hint": ai_result.get("action_hint")
            or (target_explanation["action_hint"] if target_explanation else fallback["suggestion"]["suggestion"]),
        }
        if target_explanation or ai_result.get("explanation")
        else None,
        "explanations": explanations,
    }


def _build_ai_prompt(schedule_result, target_explanation, explanations):
    unscheduled = [
        {
            "subject": item["class"].subject,
            "teacher": item["class"].teacher,
            "batch": item["class"].batch,
            "day_of_week": item["class"].day_of_week,
            "start_time": str(item["class"].start_time),
            "end_time": str(item["class"].end_time),
            "reason": item["reason"],
        }
        for item in schedule_result.get("unscheduled", [])[:6]
    ]
    conflicts = schedule_result.get("conflicts", [])[:6]
    compact_explanations = explanations[:6]

    return (
        "You are an academic scheduling assistant. "
        "Return compact JSON with keys: title, suggestion, subject, explanation, action_hint. "
        "Base your answer only on the provided scheduling data.\n"
        f"Unscheduled: {json.dumps(unscheduled)}\n"
        f"Conflicts: {json.dumps(conflicts)}\n"
        f"Explanation objects: {json.dumps(compact_explanations)}\n"
        f"Target explanation: {json.dumps(target_explanation)}"
    )


def _request_ai_guidance(api_key, model, prompt):
    payload = json.dumps(
        {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "Return only valid JSON with title, suggestion, subject, explanation, and action_hint.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")

    http_request = request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=15) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.URLError as exc:
        raise RuntimeError("LLM assistant request failed.") from exc

    content = body["choices"][0]["message"]["content"]
    return json.loads(content)


def _build_action_hint(reason):
    if "Teacher is unavailable" in reason:
        return "Move the session to a day when the teacher is available or adjust faculty availability data."
    if "Teacher already has" in reason:
        return "Reslot one of the teacher's overlapping sessions or lock the more important one before rerunning."
    if "Batch already has" in reason:
        return "Move one of the overlapping batch sessions to reduce student timetable collisions."
    if "Locked session could not be scheduled" in reason:
        return "Check room capacity, room type, required features, or blackout windows for this fixed session."
    if "higher-value sessions" in reason:
        return "Increase this session's priority only if it is academically critical, otherwise keep the higher-value allocation."
    if "No compatible room" in reason:
        return "Add a compatible room, reduce constraints, or move the session to a lower-demand time window."
    return "Inspect the conflicting constraints and adjust room, time, or priority inputs before rerunning."
