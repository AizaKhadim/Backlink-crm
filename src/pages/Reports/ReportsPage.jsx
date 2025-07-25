import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import * as XLSX from "xlsx";
import "./ReportsPage.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const categories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks"
];

const ReportsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [allBacklinks, setAllBacklinks] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [projectBacklinkCount, setProjectBacklinkCount] = useState({});
  const { role } = useUser();

  useEffect(() => {
    const fetchProjects = async () => {
      const snap = await getDocs(collection(db, "projects"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(list);

      // Fetch backlinks count for each project
      const counts = {};
      for (const proj of list) {
        let total = 0;
        for (const cat of categories) {
          const snap = await getDocs(collection(db, "projects", proj.id, cat));
          total += snap.size;
        }
        counts[proj.title] = total;
      }
      setProjectBacklinkCount(counts);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchBacklinks = async () => {
      let backlinks = [];
      for (const cat of categories) {
        const snap = await getDocs(collection(db, "projects", selectedProjectId, cat));
        const links = snap.docs.map(doc => ({
          ...doc.data(),
          category: cat,
        }));
        backlinks.push(...links);
      }
      setAllBacklinks(backlinks);
    };
    fetchBacklinks();
  }, [selectedProjectId]);

  const filteredLinks = allBacklinks.filter(link => {
    if (!fromDate && !toDate) return true;
    const linkDate = new Date(link.createdAt?.toDate?.() || link.createdAt);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return (!from || linkDate >= from) && (!to || linkDate <= to);
  });

  const created = filteredLinks.filter(l => l.status?.toLowerCase() === "created").length;
  const pending = filteredLinks.filter(l => l.status?.toLowerCase() === "pending").length;
  const total = filteredLinks.length;

  const categoryCounts = {};
  categories.forEach(cat => {
    categoryCounts[cat] = filteredLinks.filter(link => link.category === cat).length;
  });

  const handleExport = () => {
    const data = filteredLinks.map(link => ({
      Category: link.category,
      URL: link.url,
      Status: link.status,
      Date: link.createdAt?.toDate?.().toLocaleDateString() || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backlink Report");
    XLSX.writeFile(workbook, "Backlink_Report.xlsx");
  };

  return (
    <div className="reports-page">
      <h2>📄 Project Reports</h2>

      {role !== "viewer" && (
        <div className="filters">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <div className="date-filters">
            <label>
              From:
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </div>

          <button className="export-btn" onClick={handleExport}>
            📥 Export to Excel
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="stats">
        <div className="stat-card">
          <h3>{total}</h3>
          <p>Total Links</p>
        </div>
        <div className="stat-card">
          <h3>{created}</h3>
          <p>Created</p>
        </div>
        <div className="stat-card">
          <h3>{pending}</h3>
          <p>Pending</p>
        </div>
      </div>
      {/* 🔵 NEW BLOCK: Category-wise cards */}
<div className="category-stats">
  {categories.map((cat) => (
    <div className="stat-card small" key={cat}>
      <h4>{categoryCounts[cat]}</h4>
      <p>{cat}</p>
    </div>
  ))}
</div>


      {/* Charts */}
      <div className="charts">
        <div className="chart-box">
          <h4>Backlinks by Category (Selected Project)</h4>
          <Bar
            data={{
              labels: categories,
              datasets: [
                {
                  label: "Backlinks",
                  data: categories.map((cat) => categoryCounts[cat]),
                  backgroundColor: "#667eea",
                },
              ],
            }}
            options={{ responsive: true }}
          />
        </div>

        <div className="chart-box">
          <h4>Total Backlinks per Project</h4>
          <Bar
            data={{
              labels: Object.keys(projectBacklinkCount),
              datasets: [
                {
                  label: "Total Backlinks",
                  data: Object.values(projectBacklinkCount),
                  backgroundColor: "#00b894",
                },
              ],
            }}
            options={{ responsive: true }}
          />
        </div>
      </div>

      {/* Table */}
      <table className="report-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>URL</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredLinks.map((row, i) => (
            <tr key={i}>
              <td>{row.category}</td>
              <td>
                <a href={row.url} target="_blank" rel="noreferrer">
                  {row.url}
                </a>
              </td>
              <td>
                <span className={`status-badge ${row.status?.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
              <td>
                {row.createdAt?.toDate?.().toLocaleDateString() || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsPage;
