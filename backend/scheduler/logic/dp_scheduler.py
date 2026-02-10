from typing import List, Dict, Any
import bisect
def weighted_interval_schedule(sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not sessions:
        return {"max_value": 0, "chosen_ids": []}
    sorted_sessions = sorted(sessions, key = lambda x: x["end"])
    n = len(sorted_sessions)
    ends = []
    for s in sorted_sessions:
        ends.append(s["end"])
    def finding(i: int) -> int:
        start_i = sorted_sessions[i]["start"]
        idx = bisect.bisect_right(ends, start_i) - 1
        return idx  
    dp = [0] * (n + 1)
    mark = [False] * n
    for i in range(1, n + 1):
        s = sorted_sessions[i - 1]
        j = finding(i - 1)
        if j >= 0:
            take = s["value"] + dp[j + 1]
        else:
            take = s["value"]
        skip = dp[i - 1]
        if take > skip:
            dp[i] = take
            mark[i - 1] = True
        else:
            dp[i] = skip
            mark[i - 1] = False
    idx = []
    i = n - 1
    while i >= 0:
        if mark[i]:
            idx.append(sorted_sessions[i]["id"])
            j = finding(i)
            i = j
        else:
            i -= 1
    idx.reverse()
    return {
        "max_value": dp[n],
        "chosen_ids": idx,
    }
