from flask import Flask, request, jsonify
from flask_cors import CORS
import heapq
import os

app = Flask(__name__)
CORS(app)

def schedule_classes(classes):
    classes.sort(key=lambda x: x[0])
    heap = []
    room_count = 0
    assignment = {}

    for start, end, id_given in classes:
        if heap and heap[0][0] <= start:
            _, room = heapq.heappop(heap)
        else:
            room_count += 1
            room = room_count
        assignment[id_given] = room
        heapq.heappush(heap, (end, room))
    return assignment, room_count

@app.route('/schedule', methods=['POST'])
def schedule():
    data = request.get_json()
    classes = [(float(c["start"]), float(c["end"]), i+1) for i, c in enumerate(data["classes"])]
    assignment, total_rooms = schedule_classes(classes)
    results = [{"id": id_given, "room": assignment[id_given]} for (_, _, id_given) in classes]
    return jsonify({"results": results, "total_rooms": total_rooms})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
