import bisect


def weighted_interval_scheduling(classes):
    if not classes:
        return []
    sorted_classes = sorted(classes, key=lambda x: x.end_time)
    n = len(sorted_classes)

    ends = [cls.end_time for cls in sorted_classes]

    def find_last_non_conflict(i):
        idx = bisect.bisect_right(ends, sorted_classes[i].start_time) - 1
        return idx

    dp = [0] * (n + 1)
    take = [False] * n

    for i in range(1, n + 1):
        current = sorted_classes[i - 1]
        j = find_last_non_conflict(i - 1)

        include_val = current.value + (dp[j + 1] if j >= 0 else 0)
        exclude_val = dp[i - 1]

        if include_val > exclude_val:
            dp[i] = include_val
            take[i - 1] = True
        else:
            dp[i] = exclude_val

    result = []
    i = n - 1

    while i >= 0:
        if take[i]:
            result.append(sorted_classes[i])
            i = find_last_non_conflict(i)
        else:
            i -= 1

    return result[::-1]
