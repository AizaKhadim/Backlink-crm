import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import "./GoalsPage.css";

const categories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const GoalsPage = () => {
  const { role } = useUser();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    dueDate: "",
  });
  const [backlinkCount, setBacklinkCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      const snapshot = await getDocs(collection(db, "projects"));
      const projectList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
    };
    fetchProjects();
  }, []);

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
  };

  const fetchGoalsAndBacklinks = async (projectId) => {
    setLoading(true);
    const goalsSnap = await getDocs(collection(db, "projects", projectId, "goals"));
    const goalData = goalsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setGoals(goalData);

    let total = 0;
    for (const cat of categories) {
      const snap = await getDocs(collection(db, "projects", projectId, cat));
      total += snap.size;
    }
    setBacklinkCount(total);
    setLoading(false);

    const today = new Date().toISOString().split("T")[0];
    const dueSoon = goalData.filter((g) => g.dueDate <= today && total < g.target);
    setReminders(dueSoon);
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchGoalsAndBacklinks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddGoal = async () => {
    const { title, target, dueDate } = formData;
    if (!title || !target || !dueDate || !selectedProjectId)
      return alert("All fields are required!");

    await addDoc(collection(db, "projects", selectedProjectId, "goals"), {
      ...formData,
      target: Number(target),
      createdAt: serverTimestamp(),
    });

    setFormData({ title: "", target: "", dueDate: "" });
    alert("🎯 Goal added!");
    fetchGoalsAndBacklinks(selectedProjectId);
  };

  const getStatus = (goal) => {
    const now = new Date();
    const due = new Date(goal.dueDate);
    if (backlinkCount >= goal.target) return "Completed";
    if (now > due) return "Overdue";
    if (backlinkCount > 0) return "In Progress";
    return "Pending";
  };

  return (
    <div className="goals-page">
      <h2>📊 Project Goals</h2>

      {reminders.length > 0 && (
        <div className="notifications-box">
          <button onClick={() => setShowNotifications(!showNotifications)}>
            🔔 {reminders.length} Reminder{reminders.length > 1 ? "s" : ""}
          </button>
          {showNotifications && (
            <ul className="reminder-list">
              {reminders.map((g) => (
                <li key={g.id}>
                  <strong>{g.title}</strong> is due on <span>{g.dueDate}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="project-selector">
        <label>Select Project:</label>
        <select value={selectedProjectId} onChange={handleProjectChange}>
          <option value="">-- Choose a project --</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.title}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && role !== "viewer" && (
        <div className="goal-form">
          <input
            name="title"
            placeholder="Goal Title"
            value={formData.title}
            onChange={handleInputChange}
          />
          <input
            name="target"
            type="number"
            placeholder="Target Backlinks"
            value={formData.target}
            onChange={handleInputChange}
          />
          <input
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
          />
          <button onClick={handleAddGoal}>Add Goal</button>
        </div>
      )}

      {selectedProjectId && (
        <>
          <h3>Total Backlinks: {backlinkCount}</h3>

          {loading ? (
            <p>Loading goals...</p>
          ) : goals.length === 0 ? (
            <p>No goals for this project yet.</p>
          ) : (
            <table className="goals-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => {
                  const status = getStatus(goal);
                  const progress = Math.min(
                    (backlinkCount / goal.target) * 100,
                    100
                  ).toFixed(1);
                  return (
                    <tr key={goal.id}>
                      <td>{goal.title}</td>
                      <td>{goal.target}</td>
                      <td>{goal.dueDate}</td>
                      <td>
                        <span className={`status ${status}`}>{status}</span>
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          >
                            {progress}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default GoalsPage;
